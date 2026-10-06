package vantaCore.application.webhook.infrastructure.persistence.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.webhook.infrastructure.persistence.entity.WebhookDeliveryEntity;

import java.util.UUID;

public interface SpringDataWebhookDeliveryRepositoryInterface extends JpaRepository<WebhookDeliveryEntity, UUID> {

    Page<WebhookDeliveryEntity> findAllBySubscriptionId(UUID subscriptionId, Pageable pageable);
}
