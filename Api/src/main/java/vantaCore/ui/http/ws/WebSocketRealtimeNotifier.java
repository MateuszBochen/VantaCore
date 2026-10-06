package vantaCore.ui.http.ws;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import vantaCore.application.shared.domain.realtime.RealtimeNotifierInterface;

import java.io.IOException;
import java.util.UUID;

@Component
public class WebSocketRealtimeNotifier implements RealtimeNotifierInterface {

    private static final Logger log = LoggerFactory.getLogger(WebSocketRealtimeNotifier.class);

    // Unlike the Spring-managed ObjectMapper used for REST responses (which has JavaTimeModule
    // auto-registered by JacksonAutoConfiguration), this is a plain local instance - without this,
    // any payload carrying an Instant (e.g. NotificationResult.createdAt) fails to serialize.
    private static final ObjectMapper MAPPER = new ObjectMapper()
        .registerModule(new JavaTimeModule())
        .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private final WebSocketSessionRegistry sessionRegistry;

    public WebSocketRealtimeNotifier(WebSocketSessionRegistry sessionRegistry) {
        this.sessionRegistry = sessionRegistry;
    }

    @Override
    public void broadcastAll(String eventType, Object payload) {
        String json = toJson(eventType, payload);
        var sessions = this.sessionRegistry.allSessions();
        log.info("Broadcasting {} to {} connected session(s)", eventType, sessions.size());
        sessions.forEach(session -> send(session, json));
    }

    @Override
    public void notifyUser(UUID userId, String eventType, Object payload) {
        String json = toJson(eventType, payload);
        var sessions = this.sessionRegistry.sessionsFor(userId);

        if (sessions.isEmpty()) {
            log.info("notifyUser: no connected WebSocket session for user {} (type={}) - dropped, not queued", userId, eventType);
            return;
        }

        log.info("Sending {} to user {} ({} session(s))", eventType, userId, sessions.size());
        sessions.forEach(session -> send(session, json));
    }

    private String toJson(String eventType, Object payload) {
        try {
            return MAPPER.writeValueAsString(new WebSocketMessage(eventType, payload));
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Could not serialize WebSocket message of type " + eventType, exception);
        }
    }

    private void send(WebSocketSession session, String json) {
        if (!session.isOpen()) {
            log.warn("Skipping send to session {} - registry has it but it's already closed", session.getId());
            return;
        }

        try {
            session.sendMessage(new TextMessage(json));
        } catch (IOException exception) {
            log.warn("Failed to send WebSocket message to session {}", session.getId(), exception);
        }
    }
}
