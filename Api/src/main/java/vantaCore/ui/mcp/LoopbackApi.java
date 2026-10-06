package vantaCore.ui.mcp;

import org.springframework.core.env.Environment;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

/** A RestClient pointed at THIS running API over loopback - MCP tool calls are executed as real
 HTTP requests against the same endpoints the frontend uses, so they go through the exact same
 security filters, @RequiresResource checks, validation and audit logging, with no MCP-specific
 copy of any of it. The port is the one the embedded server actually bound (local.server.port),
 read lazily since it's only known once the server has started. */
@Component
public class LoopbackApi {

    private final Environment environment;
    private final JdkClientHttpRequestFactory requestFactory;
    private volatile RestClient client;

    public LoopbackApi(Environment environment) {
        this.environment = environment;
        HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(5))
            .build();
        this.requestFactory = new JdkClientHttpRequestFactory(httpClient);
        this.requestFactory.setReadTimeout(Duration.ofMinutes(2));
    }

    public String baseUrl() {
        String port = this.environment.getProperty("local.server.port", this.environment.getProperty("server.port", "8080"));
        return "http://127.0.0.1:" + port;
    }

    public RestClient client() {
        RestClient current = this.client;
        if (current == null) {
            current = RestClient.builder()
                .baseUrl(baseUrl())
                .requestFactory(this.requestFactory)
                .build();
            this.client = current;
        }
        return current;
    }
}
