package vantaCore.application.webhook.domain.repository;

import vantaCore.application.webhook.domain.WebhookDeliveryAggregate;

import java.util.List;
import java.util.UUID;

public interface WebhookDeliveryRepositoryInterface {

    /** append-only - always an insert, never an update (see WebhookDeliveryAggregate) */
    void save(WebhookDeliveryAggregate delivery);

    /** Paginated (0-indexed page, page size = limit), newest deliveredAt first. */
    WebhookDeliveryPage findPageBySubscriptionId(UUID subscriptionId, int page, int limit);

    record WebhookDeliveryPage(List<WebhookDeliveryAggregate> items, long total) {
    }
}
