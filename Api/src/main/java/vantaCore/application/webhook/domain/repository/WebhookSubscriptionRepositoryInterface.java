package vantaCore.application.webhook.domain.repository;

import vantaCore.application.webhook.domain.WebhookSubscriptionAggregate;
import vantaCore.application.webhook.domain.WebhookSubscriptionSnapshot;
import vantaCore.application.webhook.domain.vo.WebhookEventType;
import vantaCore.application.webhook.domain.vo.WebhookSubscriptionId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WebhookSubscriptionRepositoryInterface {

    /** encrypts secret on the way in (GENERIC only, null for SLACK/TEAMS/DISCORD) - see
     CredentialEncryptor */
    void save(WebhookSubscriptionAggregate subscription);

    /** decrypts secret on the way out - only ever called server-side (delivery signing, or the
     create/regenerate response that shows it to the user once) */
    Optional<WebhookSubscriptionSnapshot> findById(WebhookSubscriptionId id);

    List<WebhookSubscriptionSnapshot> findAllByProjectId(UUID projectId);

    /** WebhookDeliveryService's hot-path lookup - every enabled subscription for this project whose
     eventTypes contains this type, regardless of page/limit (a project's subscription count is
     expected to be small, same reasoning as AutomationEngineRuleRepositoryInterface's equivalent). */
    List<WebhookSubscriptionSnapshot> findAllEnabledByProjectIdAndEventType(UUID projectId, WebhookEventType eventType);

    void deleteById(WebhookSubscriptionId id);
}
