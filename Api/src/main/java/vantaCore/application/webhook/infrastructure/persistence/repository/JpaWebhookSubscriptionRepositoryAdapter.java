package vantaCore.application.webhook.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.shared.infrastructure.security.CredentialEncryptor;
import vantaCore.application.webhook.domain.WebhookSubscriptionAggregate;
import vantaCore.application.webhook.domain.WebhookSubscriptionSnapshot;
import vantaCore.application.webhook.domain.repository.WebhookSubscriptionRepositoryInterface;
import vantaCore.application.webhook.domain.vo.WebhookEventType;
import vantaCore.application.webhook.domain.vo.WebhookSubscriptionId;
import vantaCore.application.webhook.infrastructure.persistence.entity.WebhookSubscriptionEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaWebhookSubscriptionRepositoryAdapter implements WebhookSubscriptionRepositoryInterface {

    private final SpringDataWebhookSubscriptionRepositoryInterface repository;
    private final CredentialEncryptor credentialEncryptor;

    public JpaWebhookSubscriptionRepositoryAdapter(
        SpringDataWebhookSubscriptionRepositoryInterface repository,
        CredentialEncryptor credentialEncryptor
    ) {
        this.repository = repository;
        this.credentialEncryptor = credentialEncryptor;
    }

    @Override
    public void save(WebhookSubscriptionAggregate subscription) {
        String encryptedSecret = subscription.getSecret() == null ? null : this.credentialEncryptor.encrypt(subscription.getSecret());
        this.repository.save(WebhookSubscriptionEntity.fromDomain(subscription, encryptedSecret));
    }

    @Override
    public Optional<WebhookSubscriptionSnapshot> findById(WebhookSubscriptionId id) {
        return this.repository.findById(id.value()).map(this::toSnapshot);
    }

    @Override
    public List<WebhookSubscriptionSnapshot> findAllByProjectId(UUID projectId) {
        return this.repository.findAllByProjectId(projectId).stream().map(this::toSnapshot).toList();
    }

    @Override
    public List<WebhookSubscriptionSnapshot> findAllEnabledByProjectIdAndEventType(UUID projectId, WebhookEventType eventType) {
        return this.repository.findAllByProjectIdAndEnabledTrue(projectId).stream()
            .map(this::toSnapshot)
            .filter(snapshot -> snapshot.eventTypes().contains(eventType))
            .toList();
    }

    @Override
    public void deleteById(WebhookSubscriptionId id) {
        this.repository.deleteById(id.value());
    }

    private WebhookSubscriptionSnapshot toSnapshot(WebhookSubscriptionEntity entity) {
        String decryptedSecret = entity.getEncryptedSecret() == null ? null : this.credentialEncryptor.decrypt(entity.getEncryptedSecret());
        return entity.toDomain(decryptedSecret);
    }
}
