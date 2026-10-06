package vantaCore.application.webhook.appliaction.query.listWebhookDeliveries;

import vantaCore.application.webhook.domain.vo.WebhookDeliveryStatus;

import java.time.Instant;
import java.util.UUID;

public record WebhookDeliveryResult(
    UUID id,
    String eventType,
    Integer statusCode,
    WebhookDeliveryStatus status,
    int attempt,
    Instant deliveredAt
) {
}
