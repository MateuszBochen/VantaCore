package vantaCore.application.notification.appliaction.command.markNotificationAsRead;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

final public class MarkNotificationAsReadCommand {

    @NotNull
    private final UUID notificationId;

    public MarkNotificationAsReadCommand(UUID notificationId) {
        this.notificationId = notificationId;
    }

    public UUID getNotificationId() {
        return notificationId;
    }
}
