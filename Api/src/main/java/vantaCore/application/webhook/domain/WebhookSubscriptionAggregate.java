package vantaCore.application.webhook.domain;

import vantaCore.application.webhook.domain.vo.WebhookEventType;
import vantaCore.application.webhook.domain.vo.WebhookSubscriptionId;
import vantaCore.application.webhook.domain.vo.WebhookTargetType;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/** Plain mutable row, same shape as AutomationEngineRuleAggregate (PUT upserts by id, no edit
 history kept). targetType and secret are fixed for the subscription's lifetime once created -
 changeSubscription() (the PUT path) can only ever replace eventTypes/targetUrl/enabled; changing
 targetType means delete+recreate, and secret has its own regenerateSecret() mutator reached only
 through the dedicated regeneration endpoint. secret is null for every targetType except GENERIC -
 SLACK/TEAMS/DISCORD have no credential at all (see WebhookTargetType). */
public class WebhookSubscriptionAggregate {
    private final WebhookSubscriptionId id;
    private final UUID projectId;
    private final Set<WebhookEventType> eventTypes;
    private final WebhookTargetType targetType;
    private final String targetUrl;
    private final String secret;
    private final boolean enabled;
    private final UUID createdByUserId;
    private final Instant createdAt;

    private WebhookSubscriptionAggregate(
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
        this.id = id;
        this.projectId = projectId;
        this.eventTypes = eventTypes == null ? Set.of() : Set.copyOf(eventTypes);
        this.targetType = targetType;
        this.targetUrl = targetUrl;
        this.secret = secret;
        this.enabled = enabled;
        this.createdByUserId = createdByUserId;
        this.createdAt = createdAt;
    }

    /** A brand-new subscription - also used to rebuild one from storage, since id/projectId/
     createdAt/createdByUserId are supplied either way. */
    public static WebhookSubscriptionAggregate newSubscription(
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
        return new WebhookSubscriptionAggregate(id, projectId, eventTypes, targetType, targetUrl, secret, enabled, createdByUserId, createdAt);
    }

    /** PUT - id/projectId/targetType/secret/createdByUserId/createdAt all carry over from the
     current instance, never from the caller. */
    public WebhookSubscriptionAggregate changeSubscription(Set<WebhookEventType> eventTypes, String targetUrl, boolean enabled) {
        return new WebhookSubscriptionAggregate(
            this.id, this.projectId, eventTypes, this.targetType, targetUrl, this.secret, enabled, this.createdByUserId, this.createdAt
        );
    }

    /** GENERIC-only, enforced by RegenerateWebhookSecretQueryHandler rather than here - invalidates
     the previous secret by replacing it outright. */
    public WebhookSubscriptionAggregate regenerateSecret(String newSecret) {
        return new WebhookSubscriptionAggregate(
            this.id, this.projectId, this.eventTypes, this.targetType, this.targetUrl, newSecret, this.enabled, this.createdByUserId, this.createdAt
        );
    }

    public WebhookSubscriptionId getId() {
        return id;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public Set<WebhookEventType> getEventTypes() {
        return eventTypes;
    }

    public WebhookTargetType getTargetType() {
        return targetType;
    }

    public String getTargetUrl() {
        return targetUrl;
    }

    public String getSecret() {
        return secret;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public UUID getCreatedByUserId() {
        return createdByUserId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public WebhookSubscriptionSnapshot toSnapshot() {
        return new WebhookSubscriptionSnapshot(id, projectId, eventTypes, targetType, targetUrl, secret, enabled, createdByUserId, createdAt);
    }
}
