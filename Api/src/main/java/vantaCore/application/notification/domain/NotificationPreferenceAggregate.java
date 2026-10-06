package vantaCore.application.notification.domain;

import vantaCore.application.notification.domain.vo.NotificationEventType;
import vantaCore.application.notification.domain.vo.NotificationMode;
import vantaCore.application.notification.domain.vo.NotificationPreferenceId;

import java.time.Instant;
import java.util.UUID;

/** One row per (userId, projectId, eventType) override - projectId/eventType null means "applies to
 all projects"/"all event types" respectively. No row for a given combination = REALTIME (today's
 behavior, unchanged) - these are overrides, not a whitelist, so there's no "delete" mutator either;
 "reset to default" is just upserting REALTIME back onto the same key. */
public class NotificationPreferenceAggregate {
    private final NotificationPreferenceId id;
    private final UUID userId;
    private final UUID projectId;
    private final NotificationEventType eventType;
    private final NotificationMode mode;
    private final Instant updatedAt;

    private NotificationPreferenceAggregate(
        NotificationPreferenceId id,
        UUID userId,
        UUID projectId,
        NotificationEventType eventType,
        NotificationMode mode,
        Instant updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.projectId = projectId;
        this.eventType = eventType;
        this.mode = mode;
        this.updatedAt = updatedAt;
    }

    /** id is caller-supplied (either a freshly generated one for a brand-new override, or the
     existing row's own id when overwriting the same key) - the aggregate itself doesn't know or
     care which case it is, see UpsertNotificationPreferenceCommandHandler. */
    public static NotificationPreferenceAggregate of(
        NotificationPreferenceId id,
        UUID userId,
        UUID projectId,
        NotificationEventType eventType,
        NotificationMode mode,
        Instant updatedAt
    ) {
        return new NotificationPreferenceAggregate(id, userId, projectId, eventType, mode, updatedAt);
    }

    public NotificationPreferenceId getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public NotificationEventType getEventType() {
        return eventType;
    }

    public NotificationMode getMode() {
        return mode;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
