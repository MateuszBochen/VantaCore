package vantaCore.application.notification.appliaction.query.listNotifications;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record NotificationResult(
    UUID id,
    String type,
    Map<String, Object> payload,
    boolean read,
    Instant createdAt
) {
}
