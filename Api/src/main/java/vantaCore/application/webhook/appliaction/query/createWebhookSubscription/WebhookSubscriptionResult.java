package vantaCore.application.webhook.appliaction.query.createWebhookSubscription;

import vantaCore.application.webhook.domain.vo.WebhookEventType;
import vantaCore.application.webhook.domain.vo.WebhookTargetType;

import java.util.Set;
import java.util.UUID;

/** secret is non-null only when targetType is GENERIC, and only ever appears in THIS response -
 see ListWebhookSubscriptionsQuery's own (deliberately narrower) result type for every later GET,
 and WebhookSecretResult for the one other place a secret is ever shown (regeneration). */
public record WebhookSubscriptionResult(
    UUID id,
    Set<WebhookEventType> eventTypes,
    WebhookTargetType targetType,
    String targetUrl,
    boolean enabled,
    String secret
) {
}
