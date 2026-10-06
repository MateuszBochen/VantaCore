package vantaCore.ui.http.ws;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.UUID;

// The handshake (WebSocketHandshakeAuthInterceptor) rejects unauthenticated upgrades outright, so by
// the time this handler ever sees a session, userId is always present.
@Component
public class WebSocketServer extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(WebSocketServer.class);

    private final WebSocketSessionRegistry sessionRegistry;

    public WebSocketServer(WebSocketSessionRegistry sessionRegistry) {
        this.sessionRegistry = sessionRegistry;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        UUID userId = userIdOf(session);

        if (userId != null) {
            this.sessionRegistry.register(userId, session);
            log.info("WS connected: session {} registered for user {}", session.getId(), userId);
        } else {
            log.warn("WS connected without a userId attribute: session {} (handshake interceptor should have rejected this)", session.getId());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        UUID userId = userIdOf(session);

        if (userId != null) {
            this.sessionRegistry.unregister(userId, session);
            log.info("WS closed: session {} unregistered for user {} ({})", session.getId(), userId, status);
        }
    }

    private UUID userIdOf(WebSocketSession session) {
        return (UUID) session.getAttributes().get(WebSocketHandshakeAuthInterceptor.USER_ID_ATTRIBUTE);
    }
}
