package vantaCore.ui.http.rest.controller.mcp;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.ui.mcp.McpJsonRpcHandler;
import vantaCore.ui.mcp.McpToolMode;

import java.util.List;
import java.util.Optional;

/** MCP server endpoint (Streamable HTTP transport, stateless - see McpJsonRpcHandler). Under /api,
 so Spring Security already requires authentication: an MCP client sends
 "Authorization: Bearer vc_pat_..." (a personal access token, see AccessTokenController) and every
 tool call runs as that user.
   /api/mcp          - every API operation as its own tool
   /api/mcp/compact  - three generic tools (list/describe/call operation), for clients that struggle
                       with ~95 tools
 Not the frontend's normal response envelope - MCP clients expect raw JSON-RPC messages. */
@RestController
@RequestMapping("/api/mcp")
final public class McpController {

    private final McpJsonRpcHandler handler;
    private final List<String> allowedOrigins;

    McpController(McpJsonRpcHandler handler, @Value("${app.cors.allowed-origins}") List<String> allowedOrigins) {
        this.handler = handler;
        this.allowedOrigins = allowedOrigins;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<JsonNode> full(
        @RequestBody String body,
        @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
        @RequestHeader(value = HttpHeaders.ORIGIN, required = false) String origin
    ) {
        return respond(body, McpToolMode.FULL, authorization, origin);
    }

    @PostMapping(value = "/compact", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<JsonNode> compact(
        @RequestBody String body,
        @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
        @RequestHeader(value = HttpHeaders.ORIGIN, required = false) String origin
    ) {
        return respond(body, McpToolMode.COMPACT, authorization, origin);
    }

    // No server-initiated stream (stateless server) - the spec's answer to GET is 405.
    @GetMapping({"", "/compact"})
    public ResponseEntity<Void> noStream() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).header(HttpHeaders.ALLOW, "POST").build();
    }

    private ResponseEntity<JsonNode> respond(String body, McpToolMode mode, String authorization, String origin) {
        // The spec requires validating Origin (DNS-rebinding protection) - browsers always send it,
        // non-browser MCP clients usually don't; only a foreign browser origin is refused.
        if (origin != null && !this.allowedOrigins.contains(origin)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<JsonNode> response = this.handler.handle(body, mode, authorization);

        return response
            .map(json -> ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(json))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.ACCEPTED).build());
    }
}
