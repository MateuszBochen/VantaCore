package vantaCore.application.webhook.domain;

import vantaCore.application.webhook.domain.vo.WebhookDeliveryId;
import vantaCore.application.webhook.domain.vo.WebhookDeliveryStatus;

import java.time.Instant;
import java.util.UUID;

/** Write-once - one row per delivery ATTEMPT, same "append-only, no changeX()" shape as
 AutomationRuleExecutionAggregate. eventType is a plain String rather than WebhookEventType - the
 test endpoint (POST .../webhook/{id}/test) fires a synthetic delivery through this same pipeline
 using a "TEST" marker that isn't one of the 4 real WebhookEventType values, so the column can't be
 typed to that enum. */
public class WebhookDeliveryAggregate {
    private final WebhookDeliveryId id;
    private final UUID subscriptionId;
    private final String eventType;
    private final Integer statusCode;
    private final WebhookDeliveryStatus status;
    private final int attempt;
    private final Instant deliveredAt;

    private WebhookDeliveryAggregate(
        WebhookDeliveryId id,
        UUID subscriptionId,
        String eventType,
        Integer statusCode,
        WebhookDeliveryStatus status,
        int attempt,
        Instant deliveredAt
    ) {
        this.id = id;
        this.subscriptionId = subscriptionId;
        this.eventType = eventType;
        this.statusCode = statusCode;
        this.status = status;
        this.attempt = attempt;
        this.deliveredAt = deliveredAt;
    }

    public static WebhookDeliveryAggregate newDelivery(
        WebhookDeliveryId id,
        UUID subscriptionId,
        String eventType,
        Integer statusCode,
        WebhookDeliveryStatus status,
        int attempt,
        Instant deliveredAt
    ) {
        return new WebhookDeliveryAggregate(id, subscriptionId, eventType, statusCode, status, attempt, deliveredAt);
    }

    public WebhookDeliverySnapshot toSnapshot() {
        return new WebhookDeliverySnapshot(id, subscriptionId, eventType, statusCode, status, attempt, deliveredAt);
    }
}
