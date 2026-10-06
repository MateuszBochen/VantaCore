package vantaCore.application.notification.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import vantaCore.application.notification.domain.NotificationPreferenceAggregate;
import vantaCore.application.notification.domain.vo.NotificationEventType;
import vantaCore.application.notification.domain.vo.NotificationMode;
import vantaCore.application.notification.domain.vo.NotificationPreferenceId;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreferenceEntity {

    @Id
    private UUID id;

    private UUID userId;
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    private NotificationEventType eventType;

    @Enumerated(EnumType.STRING)
    private NotificationMode mode;

    private Instant updatedAt;

    // Hibernate requires it
    protected NotificationPreferenceEntity() {}

    private NotificationPreferenceEntity(
        UUID id,
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

    public static NotificationPreferenceEntity fromDomain(NotificationPreferenceAggregate preference) {
        return new NotificationPreferenceEntity(
            preference.getId().value(),
            preference.getUserId(),
            preference.getProjectId(),
            preference.getEventType(),
            preference.getMode(),
            preference.getUpdatedAt()
        );
    }

    public NotificationPreferenceAggregate toDomain() {
        return NotificationPreferenceAggregate.of(
            new NotificationPreferenceId(this.id),
            this.userId,
            this.projectId,
            this.eventType,
            this.mode,
            this.updatedAt
        );
    }
}
