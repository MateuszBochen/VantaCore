package vantaCore.ui.http.ws;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import java.util.List;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final WebSocketServer webSocketServer;
    private final WebSocketHandshakeAuthInterceptor handshakeAuthInterceptor;
    private final List<String> allowedOrigins;

    public WebSocketConfig(
        WebSocketServer webSocketServer,
        WebSocketHandshakeAuthInterceptor handshakeAuthInterceptor,
        @Value("${app.cors.allowed-origins}") List<String> allowedOrigins
    ) {
        this.webSocketServer = webSocketServer;
        this.handshakeAuthInterceptor = handshakeAuthInterceptor;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketServer, "/ws-api")
            .addInterceptors(handshakeAuthInterceptor)
            .setAllowedOrigins(allowedOrigins.toArray(new String[0]));
    }
}
