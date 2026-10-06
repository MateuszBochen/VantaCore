package vantaCore.application.webhook.domain.vo;

import java.util.UUID;

public record WebhookSubscriptionId(UUID value) {
    public WebhookSubscriptionId {
        if (value == null) {
            throw new IllegalArgumentException("WebhookSubscriptionId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
