package vantaCore.application.webhook.infrastructure.persistence.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import vantaCore.application.webhook.domain.WebhookDeliveryAggregate;
import vantaCore.application.webhook.domain.repository.WebhookDeliveryRepositoryInterface;
import vantaCore.application.webhook.infrastructure.persistence.entity.WebhookDeliveryEntity;

import java.util.UUID;

@Repository
public class JpaWebhookDeliveryRepositoryAdapter implements WebhookDeliveryRepositoryInterface {

    private final SpringDataWebhookDeliveryRepositoryInterface repository;

    public JpaWebhookDeliveryRepositoryAdapter(SpringDataWebhookDeliveryRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(WebhookDeliveryAggregate delivery) {
        this.repository.save(WebhookDeliveryEntity.fromDomain(delivery));
    }

    @Override
    public WebhookDeliveryPage findPageBySubscriptionId(UUID subscriptionId, int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "deliveredAt"));
        Page<WebhookDeliveryEntity> result = this.repository.findAllBySubscriptionId(subscriptionId, pageable);

        return new WebhookDeliveryPage(
            result.getContent().stream().map(WebhookDeliveryEntity::toDomain).toList(),
            result.getTotalElements()
        );
    }
}
