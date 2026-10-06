package vantaCore.ui.mcp;

import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.List;

/** One REST endpoint exposed as an MCP tool. inputSchema is a self-contained JSON Schema: one
 property per path/query parameter, plus "body" for the JSON request body (its referenced component
 schemas inlined under $defs). */
public record McpOperation(
    String name,
    String method,
    String pathTemplate,
    String area,
    String description,
    List<String> pathParameters,
    List<String> queryParameters,
    boolean hasBody,
    ObjectNode inputSchema
) {
    public String summaryLine() {
        return this.name + " - " + this.method + " " + this.pathTemplate;
    }
}
