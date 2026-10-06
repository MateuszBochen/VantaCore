package vantaCore.ui.mcp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriUtils;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/** Executes one McpOperation as a real HTTP request against this API (see LoopbackApi), carrying the
 MCP client's own Authorization header - the call runs as that user, with that user's permissions,
 exactly as if the frontend had made it. Argument problems the model can fix itself (unknown or
 missing arguments) come back as error results rather than exceptions. */
@Component
public class McpOperationInvoker {

    // Large list responses would otherwise flood the model's context - it can page instead.
    private static final int MAX_RESPONSE_CHARS = 100_000;

    public record Result(int status, String body) {
        public boolean isError() {
            return this.status >= 400;
        }
    }

    private final LoopbackApi loopbackApi;
    private final ObjectMapper objectMapper;

    public McpOperationInvoker(LoopbackApi loopbackApi, ObjectMapper objectMapper) {
        this.loopbackApi = loopbackApi;
        this.objectMapper = objectMapper;
    }

    public Result invoke(McpOperation operation, JsonNode arguments, String authorization) {
        JsonNode args = arguments == null || arguments.isNull() ? this.objectMapper.createObjectNode() : arguments;
        if (!args.isObject()) {
            return argumentError("Arguments must be a JSON object.");
        }

        List<String> unknown = new ArrayList<>();
        args.fieldNames().forEachRemaining(field -> {
            if (!operation.pathParameters().contains(field) && !operation.queryParameters().contains(field)
                && !(operation.hasBody() && field.equals("body"))) {
                unknown.add(field);
            }
        });
        if (!unknown.isEmpty()) {
            return argumentError("Unknown argument(s): " + String.join(", ", unknown)
                + ". Allowed: path " + operation.pathParameters() + ", query " + operation.queryParameters()
                + (operation.hasBody() ? ", body" : "") + ".");
        }

        String path = operation.pathTemplate();
        for (String parameter : operation.pathParameters()) {
            JsonNode value = args.get(parameter);
            if (value == null || value.isNull() || value.asText().isBlank()) {
                return argumentError("Missing required path argument: " + parameter);
            }
            path = path.replace("{" + parameter + "}", UriUtils.encodePathSegment(value.asText(), StandardCharsets.UTF_8));
        }

        List<String> query = new ArrayList<>();
        for (String parameter : operation.queryParameters()) {
            JsonNode value = args.get(parameter);
            if (value == null || value.isNull()) {
                continue;
            }
            if (value.isObject()) {
                // Free-form query map - each entry becomes its own query parameter.
                Iterator<Map.Entry<String, JsonNode>> entries = value.fields();
                while (entries.hasNext()) {
                    Map.Entry<String, JsonNode> entry = entries.next();
                    addQuery(query, entry.getKey(), entry.getValue());
                }
            } else {
                addQuery(query, parameter, value);
            }
        }

        URI uri = URI.create(this.loopbackApi.baseUrl() + path + (query.isEmpty() ? "" : "?" + String.join("&", query)));

        RestClient.RequestBodySpec request = this.loopbackApi.client()
            .method(HttpMethod.valueOf(operation.method()))
            .uri(uri)
            .accept(MediaType.APPLICATION_JSON);
        if (authorization != null) {
            request.header(HttpHeaders.AUTHORIZATION, authorization);
        }
        JsonNode body = args.get("body");
        if (operation.hasBody() && body != null && !body.isNull()) {
            request.contentType(MediaType.APPLICATION_JSON).body(body.toString());
        }

        return request.exchange((httpRequest, response) -> {
            String text = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
            if (text.length() > MAX_RESPONSE_CHARS) {
                text = text.substring(0, MAX_RESPONSE_CHARS)
                    + "\n... [truncated - response too large; use paging/filter parameters to narrow it]";
            }
            if (text.isBlank()) {
                text = "OK (HTTP " + response.getStatusCode().value() + ", no response body)";
            }
            return new Result(response.getStatusCode().value(), text);
        });
    }

    private void addQuery(List<String> query, String name, JsonNode value) {
        if (value.isArray()) {
            value.forEach(item -> addQuery(query, name, item));
            return;
        }
        query.add(UriUtils.encodeQueryParam(name, StandardCharsets.UTF_8) + "="
            + UriUtils.encodeQueryParam(value.isTextual() ? value.asText() : value.toString(), StandardCharsets.UTF_8));
    }

    private Result argumentError(String message) {
        return new Result(400, message);
    }
}
