package vantaCore.ui.mcp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Every REST operation the frontend can call, as MCP tools - derived from springdoc's own OpenAPI
 document (/v3/api-docs) instead of a hand-maintained list, so a new endpoint shows up in MCP by
 itself. Built lazily on first use and then cached for the app's lifetime (endpoints don't change at
 runtime; a devtools restart rebuilds it).

 Left out, because an MCP tool call can't meaningfully use them: multipart uploads (a file can't be
 passed as JSON arguments), binary downloads/exports, JWT refresh (/api/token - meaningless for an
 access token), and the MCP endpoint itself.

 springdoc emits no summaries and suffixes clashing operationIds (uploadAttachment_1, _2, ...), so
 names and descriptions are derived here: name = snake_case operationId, prefixed with the
 controller's area when that alone is ambiguous; description = the operation in words + its HTTP
 method/path, which together with the server instructions (see McpServerInstructions) is what a model
 needs to pick and call the right one. */
@Component
public class OpenApiOperationCatalog {

    private static final Logger log = LoggerFactory.getLogger(OpenApiOperationCatalog.class);
    private static final Pattern SUFFIX = Pattern.compile("_\\d+$");
    private static final Pattern CAMEL_BOUNDARY = Pattern.compile("([a-z0-9])([A-Z])");
    private static final Pattern REF = Pattern.compile("#/components/schemas/([^\"/]+)");
    private static final Set<String> HTTP_METHODS = Set.of("get", "post", "put", "delete", "patch");

    private final LoopbackApi loopbackApi;
    private final ObjectMapper objectMapper;
    private volatile List<McpOperation> operations;

    public OpenApiOperationCatalog(LoopbackApi loopbackApi, ObjectMapper objectMapper) {
        this.loopbackApi = loopbackApi;
        this.objectMapper = objectMapper;
    }

    public List<McpOperation> operations() {
        List<McpOperation> current = this.operations;
        if (current == null) {
            synchronized (this) {
                if (this.operations == null) {
                    this.operations = load();
                }
                current = this.operations;
            }
        }
        return current;
    }

    public Optional<McpOperation> find(String name) {
        return operations().stream().filter(operation -> operation.name().equals(name)).findFirst();
    }

    private List<McpOperation> load() {
        JsonNode document = this.loopbackApi.client().get().uri("/v3/api-docs").retrieve().body(JsonNode.class);
        JsonNode schemas = document.path("components").path("schemas");

        List<RawOperation> raw = new ArrayList<>();
        document.path("paths").fields().forEachRemaining(pathEntry -> {
            String path = pathEntry.getKey();
            pathEntry.getValue().fields().forEachRemaining(methodEntry -> {
                if (HTTP_METHODS.contains(methodEntry.getKey()) && isExposed(path, methodEntry.getValue())) {
                    raw.add(new RawOperation(methodEntry.getKey().toUpperCase(Locale.ROOT), path, methodEntry.getValue()));
                }
            });
        });

        Map<String, Integer> baseNameCounts = new HashMap<>();
        raw.forEach(operation -> baseNameCounts.merge(operation.baseName(), 1, Integer::sum));

        Set<String> usedNames = new LinkedHashSet<>();
        List<McpOperation> result = new ArrayList<>();
        for (RawOperation operation : raw) {
            String name = baseNameCounts.get(operation.baseName()) == 1
                ? operation.baseName()
                : operation.area() + "_" + operation.baseName();
            if (!usedNames.add(name)) {
                name = name + "_" + operation.method().toLowerCase(Locale.ROOT);
                usedNames.add(name);
            }
            result.add(toMcpOperation(truncateName(name), operation, schemas));
        }

        log.info("MCP: exposing {} API operations as tools", result.size());
        return List.copyOf(result);
    }

    private boolean isExposed(String path, JsonNode operation) {
        if (!path.startsWith("/api/") || path.startsWith("/api/mcp") || path.equals("/api/token")) {
            return false;
        }
        if (path.endsWith("/download") || path.contains("/export")) {
            return false;
        }
        JsonNode content = operation.path("requestBody").path("content");
        return !(content.has("multipart/form-data") && !content.has("application/json"));
    }

    private McpOperation toMcpOperation(String name, RawOperation operation, JsonNode schemas) {
        ObjectNode schema = this.objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode properties = schema.putObject("properties");
        ArrayNode required = this.objectMapper.createArrayNode();
        List<String> pathParameters = new ArrayList<>();
        List<String> queryParameters = new ArrayList<>();
        Set<String> referenced = new LinkedHashSet<>();

        for (JsonNode parameter : operation.node().path("parameters")) {
            String in = parameter.path("in").asText();
            String parameterName = parameter.path("name").asText();
            if (!in.equals("path") && !in.equals("query")) {
                continue;
            }

            ObjectNode property = parameter.has("schema") ? parameter.get("schema").deepCopy() : this.objectMapper.createObjectNode();
            // A free-form query map (e.g. search's customField.<id>=value filters) - its entries are
            // sent as individual query parameters, see McpOperationInvoker.
            boolean freeFormMap = "object".equals(property.path("type").asText());
            property.put("description", in.equals("path")
                ? "Path parameter."
                : freeFormMap ? "Extra query parameters as key/value pairs." : "Query parameter.");
            collectRefs(property, referenced);
            properties.set(parameterName, property);

            if (in.equals("path")) {
                pathParameters.add(parameterName);
                required.add(parameterName);
            } else {
                queryParameters.add(parameterName);
                if (parameter.path("required").asBoolean(false)) {
                    required.add(parameterName);
                }
            }
        }

        JsonNode bodySchema = operation.node().path("requestBody").path("content").path("application/json").path("schema");
        boolean hasBody = !bodySchema.isMissingNode();
        if (hasBody) {
            ObjectNode body = bodySchema.deepCopy();
            body.put("description", "JSON request body.");
            collectRefs(body, referenced);
            properties.set("body", body);
            if (operation.node().path("requestBody").path("required").asBoolean(false)) {
                required.add("body");
            }
        }

        if (!required.isEmpty()) {
            schema.set("required", required);
        }
        schema.put("additionalProperties", false);

        ObjectNode defs = inlineReferencedSchemas(referenced, schemas);
        if (!defs.isEmpty()) {
            schema.set("$defs", defs);
        }
        rewriteRefs(schema);

        return new McpOperation(
            name,
            operation.method(),
            operation.path(),
            operation.area(),
            describe(operation),
            List.copyOf(pathParameters),
            List.copyOf(queryParameters),
            hasBody,
            schema
        );
    }

    private String describe(RawOperation operation) {
        String words = CAMEL_BOUNDARY.matcher(SUFFIX.matcher(operation.node().path("operationId").asText()).replaceAll(""))
            .replaceAll("$1 $2").toLowerCase(Locale.ROOT);
        String sentence = words.isEmpty() ? operation.method() : Character.toUpperCase(words.charAt(0)) + words.substring(1);
        String area = operation.area().replace('_', ' ');
        return sentence + " (" + area + "). HTTP " + operation.method() + " " + operation.path() + ".";
    }

    // Transitive closure of every component schema reachable from the tool's own parameters/body.
    private ObjectNode inlineReferencedSchemas(Set<String> roots, JsonNode schemas) {
        ObjectNode defs = this.objectMapper.createObjectNode();
        Deque<String> queue = new ArrayDeque<>(roots);
        while (!queue.isEmpty()) {
            String schemaName = queue.poll();
            if (defs.has(schemaName) || !schemas.has(schemaName)) {
                continue;
            }
            ObjectNode copy = schemas.get(schemaName).deepCopy();
            defs.set(schemaName, copy);
            Set<String> nested = new LinkedHashSet<>();
            collectRefs(copy, nested);
            queue.addAll(nested);
        }
        return defs;
    }

    private void collectRefs(JsonNode node, Set<String> into) {
        Matcher matcher = REF.matcher(node.toString());
        while (matcher.find()) {
            into.add(matcher.group(1));
        }
    }

    // OpenAPI's "#/components/schemas/X" -> JSON Schema's local "#/$defs/X".
    private void rewriteRefs(JsonNode node) {
        if (node.isObject()) {
            ObjectNode object = (ObjectNode) node;
            JsonNode ref = object.get("$ref");
            if (ref != null && ref.isTextual()) {
                object.put("$ref", ref.asText().replace("#/components/schemas/", "#/$defs/"));
            }
            object.elements().forEachRemaining(this::rewriteRefs);
        } else if (node.isArray()) {
            node.elements().forEachRemaining(this::rewriteRefs);
        }
    }

    // MCP tool names: ^[a-zA-Z0-9_-]{1,64}$
    private String truncateName(String name) {
        return name.length() <= 64 ? name : name.substring(0, 64);
    }

    private record RawOperation(String method, String path, JsonNode node) {

        String baseName() {
            String operationId = SUFFIX.matcher(this.node.path("operationId").asText()).replaceAll("");
            return CAMEL_BOUNDARY.matcher(operationId).replaceAll("$1_$2").toLowerCase(Locale.ROOT);
        }

        // "ticket-attachment-controller" -> "ticket_attachment"
        String area() {
            JsonNode tags = this.node.path("tags");
            String tag = tags.isArray() && !tags.isEmpty() ? tags.get(0).asText() : "api";
            return tag.replaceAll("-controller$", "").replace('-', '_');
        }
    }
}
