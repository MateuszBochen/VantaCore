package vantaCore.application.webhook.domain;

import vantaCore.application.webhook.domain.vo.WebhookEventType;
import vantaCore.application.webhook.domain.vo.WebhookSubscriptionId;
import vantaCore.application.webhook.domain.vo.WebhookTargetType;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/** secret is decrypted only here, server-side (see JpaWebhookSubscriptionRepositoryAdapter) - used
 to sign an outbound GENERIC delivery (WebhookDeliveryService) or to hand back once on create/
 regenerate (WebhookSubscriptionResult/WebhookSecretResult), never returned on a later GET/list
 (see WebhookSubscriptionSummaryResult). */
public record WebhookSubscriptionSnapshot(
    WebhookSubscriptionId id,
    UUID projectId,
    Set<WebhookEventType> eventTypes,
    WebhookTargetType targetType,
    String targetUrl,
    String secret,
    boolean enabled,
    UUID createdByUserId,
    Instant createdAt
) {
}
