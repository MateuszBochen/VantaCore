package vantaCore.application.webhook.appliaction.query.listWebhookSubscriptions;

import vantaCore.application.webhook.domain.vo.WebhookEventType;
import vantaCore.application.webhook.domain.vo.WebhookTargetType;

import java.util.Set;
import java.util.UUID;

/** No secret here - shown once, only on create/regenerate responses (see
 WebhookSubscriptionResult/WebhookSecretResult), never again through this listing. */
public record WebhookSubscriptionSummaryResult(
    UUID id,
    Set<WebhookEventType> eventTypes,
    WebhookTargetType targetType,
    String targetUrl,
    boolean enabled
) {
}
