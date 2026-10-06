package vantaCore.application.notification.domain.vo;

import java.util.UUID;

public record NotificationId(UUID value) {

    public static NotificationId create() {
        return new NotificationId(UUID.randomUUID());
    }

    public NotificationId {
        if (value == null) {
            throw new IllegalArgumentException("NotificationId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
