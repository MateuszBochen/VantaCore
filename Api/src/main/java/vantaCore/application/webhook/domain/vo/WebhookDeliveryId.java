package vantaCore.application.webhook.domain.vo;

import java.util.UUID;

public record WebhookDeliveryId(UUID value) {
    public WebhookDeliveryId {
        if (value == null) {
            throw new IllegalArgumentException("WebhookDeliveryId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
