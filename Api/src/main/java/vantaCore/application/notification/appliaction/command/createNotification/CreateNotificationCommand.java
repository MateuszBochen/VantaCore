package vantaCore.application.notification.appliaction.command.createNotification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

final public class CreateNotificationCommand {

    @NotNull
    private final UUID userId;

    @NotBlank
    private final String type;

    private final Map<String, Object> payload;

    public CreateNotificationCommand(UUID userId, String type, Map<String, Object> payload) {
        this.userId = userId;
        this.type = type;
        this.payload = payload;
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
}
