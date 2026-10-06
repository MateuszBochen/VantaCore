package vantaCore.ui.mcp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/** COMPACT mode's three tools - the same operations as FULL mode, reached through a
 discover -> describe -> call loop instead of ~95 individual tool definitions. */
final class CompactTools {

    static final String LIST = "list_operations";
    static final String DESCRIBE = "describe_operation";
    static final String CALL = "call_operation";

    private CompactTools() {
    }

    static List<ObjectNode> definitions(ObjectMapper mapper) {
        ObjectNode list = tool(mapper, LIST,
            "List the VantaCore API operations available to call, one per line as 'name - METHOD path'. "
                + "Optionally filter by a search text (matched against name, path and area, e.g. 'ticket', 'sprint', 'comment').");
        ObjectNode listProperties = list.putObject("inputSchema").put("type", "object").putObject("properties");
        listProperties.putObject("search").put("type", "string").put("description", "Optional filter text.");

        ObjectNode describe = tool(mapper, DESCRIBE,
            "Get one operation's description and the JSON Schema of its arguments (path/query parameters and body). "
                + "Call this before " + CALL + " to know exactly what to send.");
        ObjectNode describeSchema = describe.putObject("inputSchema").put("type", "object");
        describeSchema.putObject("properties").putObject("name").put("type", "string").put("description", "Operation name from " + LIST + ".");
        describeSchema.putArray("required").add("name");

        ObjectNode call = tool(mapper, CALL,
            "Call a VantaCore API operation. 'arguments' must match the operation's schema from " + DESCRIBE + ".");
        ObjectNode callSchema = call.putObject("inputSchema").put("type", "object");
        ObjectNode callProperties = callSchema.putObject("properties");
        callProperties.putObject("name").put("type", "string").put("description", "Operation name from " + LIST + ".");
        callProperties.putObject("arguments").put("type", "object").put("description", "Operation arguments: path/query parameters by name, plus 'body' for the JSON body.");
        callSchema.putArray("required").add("name");

        return List.of(list, describe, call);
    }

    static String list(OpenApiOperationCatalog catalog, JsonNode arguments) {
        String search = arguments == null ? "" : arguments.path("search").asText("").toLowerCase(Locale.ROOT).trim();
        String lines = catalog.operations().stream()
            .filter(operation -> search.isEmpty()
                || operation.name().contains(search)
                || operation.pathTemplate().toLowerCase(Locale.ROOT).contains(search)
                || operation.area().contains(search))
            .map(McpOperation::summaryLine)
            .collect(Collectors.joining("\n"));
        return lines.isEmpty() ? "No operations match '" + search + "'." : lines;
    }

    static String describe(ObjectMapper mapper, McpOperation operation) {
        ObjectNode description = mapper.createObjectNode();
        description.put("name", operation.name());
        description.put("method", operation.method());
        description.put("path", operation.pathTemplate());
        description.put("description", operation.description());
        description.set("argumentsSchema", operation.inputSchema());
        return description.toPrettyString();
    }

    private static ObjectNode tool(ObjectMapper mapper, String name, String description) {
        ObjectNode tool = mapper.createObjectNode();
        tool.put("name", name);
        tool.put("description", description);
        return tool;
    }
}
