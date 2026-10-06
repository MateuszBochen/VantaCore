package vantaCore.application.notification.domain.vo;

import java.util.UUID;

public record NotificationPreferenceId(UUID value) {
    public NotificationPreferenceId {
        if (value == null) {
            throw new IllegalArgumentException("NotificationPreferenceId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
