package vantaCore.application.notification.domain;

import vantaCore.application.notification.domain.vo.NotificationId;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public class NotificationAggregate {
    private final NotificationId id;
    private final UUID userId;
    private final String type;
    private final Map<String, Object> payload;
    private final boolean read;
    /** DIGEST-mode notifications are created with this true (see CreateNotificationCommandHandler) -
     they're already visible via GET /api/notification like any other, this only tracks whether
     NotificationDigestFlushJob still owes this one a batched WebSocket push. Always false for
     REALTIME notifications (and MUTED ones are never created at all). */
    private final boolean pendingDigest;
    private final Instant createdAt;

    public NotificationAggregate(
        NotificationId id,
        UUID userId,
        String type,
        Map<String, Object> payload,
        boolean read,
        boolean pendingDigest,
        Instant createdAt
    ) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.payload = payload == null ? Map.of() : Map.copyOf(payload);
        this.read = read;
        this.pendingDigest = pendingDigest;
        this.createdAt = createdAt;
    }

    public NotificationAggregate markAsRead() {
        return new NotificationAggregate(this.id, this.userId, this.type, this.payload, true, this.pendingDigest, this.createdAt);
    }

    public NotificationAggregate markDigestFlushed() {
        return new NotificationAggregate(this.id, this.userId, this.type, this.payload, this.read, false, this.createdAt);
    }

    public NotificationId getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getType() {
        return type;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public boolean isRead() {
        return read;
    }

    public boolean isPendingDigest() {
        return pendingDigest;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
