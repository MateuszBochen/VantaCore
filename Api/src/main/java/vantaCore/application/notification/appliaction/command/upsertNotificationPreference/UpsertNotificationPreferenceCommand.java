package vantaCore.application.notification.appliaction.command.upsertNotificationPreference;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.notification.appliaction.dto.NotificationPreferenceRequest;

// Self-scoped to the caller (userId comes from the JWT, never the body) - no @RequiresResource,
// same "not a resource" precedent as the rest of the notification module.
final public class UpsertNotificationPreferenceCommand {

    @Valid
    @NotNull
    private final NotificationPreferenceRequest notificationPreferenceRequest;

    public UpsertNotificationPreferenceCommand(NotificationPreferenceRequest notificationPreferenceRequest) {
        this.notificationPreferenceRequest = notificationPreferenceRequest;
    }

    public NotificationPreferenceRequest getNotificationPreferenceRequest() {
        return notificationPreferenceRequest;
    }
}
