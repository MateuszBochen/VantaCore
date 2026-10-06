package vantaCore.application.shared.domain.realtime;

import java.util.UUID;

public interface RealtimeNotifierInterface {

    /** push an event to every currently connected client */
    void broadcastAll(String eventType, Object payload);

    /** push an event to every currently connected session belonging to this user (no-op if offline) */
    void notifyUser(UUID userId, String eventType, Object payload);
}
