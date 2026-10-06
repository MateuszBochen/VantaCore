package vantaCore.ui.mcp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** The MCP protocol itself (JSON-RPC 2.0 over the Streamable HTTP transport), stateless: every POST
 is answered directly with a JSON body - no sessions, no server-initiated messages, no SSE stream -
 which the spec allows and which is all a tools-only server needs. Implemented by hand rather than
 with the MCP Java SDK / Spring AI, whose current versions target a newer Spring Boot than this app's
 3.3; the methods involved are few: initialize, ping, tools/list, tools/call (+ notifications, which
 get no response). */
@Component
public class McpJsonRpcHandler {

    private static final Logger log = LoggerFactory.getLogger(McpJsonRpcHandler.class);

    // Newest first - the client's requested version is echoed back if we know it, else our newest.
    private static final List<String> SUPPORTED_PROTOCOL_VERSIONS = List.of("2025-06-18", "2025-03-26", "2024-11-05");

    private static final int PARSE_ERROR = -32700;
    private static final int INVALID_REQUEST = -32600;
    private static final int METHOD_NOT_FOUND = -32601;
    private static final int INVALID_PARAMS = -32602;
    private static final int INTERNAL_ERROR = -32603;

    private final OpenApiOperationCatalog catalog;
    private final McpOperationInvoker invoker;
    private final ObjectMapper objectMapper;

    public McpJsonRpcHandler(OpenApiOperationCatalog catalog, McpOperationInvoker invoker, ObjectMapper objectMapper) {
        this.catalog = catalog;
        this.invoker = invoker;
        this.objectMapper = objectMapper;
    }

    /** Empty = nothing to send back (the message was only notifications) - the caller answers 202. */
    public Optional<JsonNode> handle(String rawBody, McpToolMode mode, String authorization) {
        JsonNode message;
        try {
            message = this.objectMapper.readTree(rawBody);
        } catch (Exception exception) {
            return Optional.of(error(null, PARSE_ERROR, "Parse error"));
        }

        if (message != null && message.isArray()) {
            ArrayNode responses = this.objectMapper.createArrayNode();
            message.forEach(single -> handleSingle(single, mode, authorization).ifPresent(responses::add));
            return responses.isEmpty() ? Optional.empty() : Optional.of(responses);
        }
        return handleSingle(message, mode, authorization);
    }

    private Optional<JsonNode> handleSingle(JsonNode message, McpToolMode mode, String authorization) {
        if (message == null || !message.isObject() || !message.path("method").isTextual()) {
            // A response object sent to us (we never send requests) or garbage - nothing useful to say.
            if (message != null && message.isObject() && (message.has("result") || message.has("error"))) {
                return Optional.empty();
            }
            return Optional.of(error(message != null ? message.get("id") : null, INVALID_REQUEST, "Invalid request"));
        }

        JsonNode id = message.get("id");
        boolean isNotification = id == null;
        String method = message.get("method").asText();
        JsonNode params = message.path("params");

        if (isNotification) {
            return Optional.empty();
        }

        try {
            return Optional.of(switch (method) {
                case "initialize" -> result(id, initialize(params));
                case "ping" -> result(id, this.objectMapper.createObjectNode());
                case "tools/list" -> result(id, listTools(mode));
                case "tools/call" -> callTool(id, params, mode, authorization);
                default -> error(id, METHOD_NOT_FOUND, "Method not found: " + method);
            });
        } catch (Exception exception) {
            log.error("MCP {} failed", method, exception);
            return Optional.of(error(id, INTERNAL_ERROR, "Internal error"));
        }
    }

    private ObjectNode initialize(JsonNode params) {
        String requested = params.path("protocolVersion").asText("");
        String version = SUPPORTED_PROTOCOL_VERSIONS.contains(requested) ? requested : SUPPORTED_PROTOCOL_VERSIONS.get(0);

        ObjectNode result = this.objectMapper.createObjectNode();
        result.put("protocolVersion", version);
        result.putObject("capabilities").putObject("tools").put("listChanged", false);
        ObjectNode serverInfo = result.putObject("serverInfo");
        serverInfo.put("name", "vantacore");
        serverInfo.put("title", "VantaCore");
        serverInfo.put("version", "1.0.0");
        result.put("instructions", McpServerInstructions.TEXT);
        return result;
    }

    private ObjectNode listTools(McpToolMode mode) {
        ObjectNode result = this.objectMapper.createObjectNode();
        ArrayNode tools = result.putArray("tools");

        if (mode == McpToolMode.FULL) {
            for (McpOperation operation : this.catalog.operations()) {
                ObjectNode tool = tools.addObject();
                tool.put("name", operation.name());
                tool.put("description", operation.description());
                tool.set("inputSchema", operation.inputSchema());
                annotate(tool, operation.method());
            }
        } else {
            CompactTools.definitions(this.objectMapper).forEach(tools::add);
        }
        return result;
    }

    // Hints only (clients use them for confirmation UX) - GET reads, DELETE destroys, PUT is idempotent.
    private void annotate(ObjectNode tool, String httpMethod) {
        ObjectNode annotations = tool.putObject("annotations");
        annotations.put("readOnlyHint", httpMethod.equals("GET"));
        annotations.put("destructiveHint", httpMethod.equals("DELETE"));
        annotations.put("idempotentHint", !httpMethod.equals("POST"));
        annotations.put("openWorldHint", false);
    }

    private JsonNode callTool(JsonNode id, JsonNode params, McpToolMode mode, String authorization) {
        String name = params.path("name").asText("");
        JsonNode arguments = params.get("arguments");

        if (mode == McpToolMode.COMPACT) {
            return switch (name) {
                case CompactTools.LIST -> result(id, textResult(CompactTools.list(this.catalog, arguments), false));
                case CompactTools.DESCRIBE -> {
                    String operationName = arguments == null ? "" : arguments.path("name").asText("");
                    yield this.catalog.find(operationName)
                        .map(operation -> result(id, textResult(CompactTools.describe(this.objectMapper, operation), false)))
                        .orElseGet(() -> result(id, textResult("Unknown operation: " + operationName + " - use " + CompactTools.LIST + ".", true)));
                }
                case CompactTools.CALL -> {
                    String operationName = arguments == null ? "" : arguments.path("name").asText("");
                    yield this.catalog.find(operationName)
                        .map(operation -> invoke(id, operation, arguments.get("arguments"), authorization))
                        .orElseGet(() -> result(id, textResult("Unknown operation: " + operationName + " - use " + CompactTools.LIST + ".", true)));
                }
                default -> error(id, INVALID_PARAMS, "Unknown tool: " + name);
            };
        }

        return this.catalog.find(name)
            .map(operation -> invoke(id, operation, arguments, authorization))
            .orElseGet(() -> error(id, INVALID_PARAMS, "Unknown tool: " + name));
    }

    private JsonNode invoke(JsonNode id, McpOperation operation, JsonNode arguments, String authorization) {
        McpOperationInvoker.Result outcome = this.invoker.invoke(operation, arguments, authorization);
        log.info("MCP tool {} -> HTTP {}", operation.name(), outcome.status());

        // API errors are tool-level errors (isError), not protocol errors - the model should see the
        // 422 notifications and correct its call.
        String text = outcome.isError()
            ? "HTTP " + outcome.status() + " " + operation.method().toUpperCase(Locale.ROOT) + " " + operation.pathTemplate() + "\n" + outcome.body()
            : outcome.body();
        return result(id, textResult(text, outcome.isError()));
    }

    private ObjectNode textResult(String text, boolean isError) {
        ObjectNode result = this.objectMapper.createObjectNode();
        ObjectNode content = result.putArray("content").addObject();
        content.put("type", "text");
        content.put("text", text);
        result.put("isError", isError);
        return result;
    }

    private ObjectNode result(JsonNode id, JsonNode result) {
        ObjectNode response = this.objectMapper.createObjectNode();
        response.put("jsonrpc", "2.0");
        response.set("id", id);
        response.set("result", result);
        return response;
    }

    private ObjectNode error(JsonNode id, int code, String message) {
        ObjectNode response = this.objectMapper.createObjectNode();
        response.put("jsonrpc", "2.0");
        response.set("id", id);
        ObjectNode error = response.putObject("error");
        error.put("code", code);
        error.put("message", message);
        return response;
    }
}
