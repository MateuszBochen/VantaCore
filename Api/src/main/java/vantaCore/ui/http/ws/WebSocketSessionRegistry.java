package vantaCore.ui.http.ws;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** One user can have multiple open sessions (multiple tabs/devices), hence UUID -> Set<WebSocketSession>. */
@Component
public class WebSocketSessionRegistry {

    private final ConcurrentHashMap<UUID, Set<WebSocketSession>> sessionsByUserId = new ConcurrentHashMap<>();

    public void register(UUID userId, WebSocketSession session) {
        this.sessionsByUserId
            .computeIfAbsent(userId, id -> ConcurrentHashMap.newKeySet())
            .add(session);
    }

    public void unregister(UUID userId, WebSocketSession session) {
        this.sessionsByUserId.computeIfPresent(userId, (id, sessions) -> {
            sessions.remove(session);
            return sessions.isEmpty() ? null : sessions;
        });
    }

    public Set<WebSocketSession> sessionsFor(UUID userId) {
        return this.sessionsByUserId.getOrDefault(userId, Set.of());
    }

    public Collection<WebSocketSession> allSessions() {
        return this.sessionsByUserId.values().stream()
            .flatMap(Set::stream)
            .toList();
    }
}
