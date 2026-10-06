package vantaCore.application.webhook.domain;

import vantaCore.application.webhook.domain.vo.WebhookDeliveryId;
import vantaCore.application.webhook.domain.vo.WebhookDeliveryStatus;

import java.time.Instant;
import java.util.UUID;

public record WebhookDeliverySnapshot(
    WebhookDeliveryId id,
    UUID subscriptionId,
    String eventType,
    Integer statusCode,
    WebhookDeliveryStatus status,
    int attempt,
    Instant deliveredAt
) {
}
