package vantaCore.application.notification.appliaction.dto;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.notification.domain.vo.NotificationEventType;
import vantaCore.application.notification.domain.vo.NotificationMode;

import java.util.UUID;

final public class NotificationPreferenceRequest {

    /** null = applies to all projects */
    private final UUID projectId;

    /** null = applies to all event types */
    private final NotificationEventType eventType;

    @NotNull
    private final NotificationMode mode;

    public NotificationPreferenceRequest(UUID projectId, NotificationEventType eventType, NotificationMode mode) {
        this.projectId = projectId;
        this.eventType = eventType;
        this.mode = mode;
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
}
