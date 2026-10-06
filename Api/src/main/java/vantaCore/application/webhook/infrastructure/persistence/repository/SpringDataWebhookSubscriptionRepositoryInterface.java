package vantaCore.application.webhook.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.webhook.infrastructure.persistence.entity.WebhookSubscriptionEntity;

import java.util.List;
import java.util.UUID;

public interface SpringDataWebhookSubscriptionRepositoryInterface extends JpaRepository<WebhookSubscriptionEntity, UUID> {

    List<WebhookSubscriptionEntity> findAllByProjectId(UUID projectId);

    List<WebhookSubscriptionEntity> findAllByProjectIdAndEnabledTrue(UUID projectId);
}
