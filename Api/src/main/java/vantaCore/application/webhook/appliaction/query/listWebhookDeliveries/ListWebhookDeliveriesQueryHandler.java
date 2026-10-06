package vantaCore.application.webhook.appliaction.query.listWebhookDeliveries;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.exception.WebhookSubscriptionNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.webhook.domain.WebhookDeliveryAggregate;
import vantaCore.application.webhook.domain.WebhookDeliverySnapshot;
import vantaCore.application.webhook.domain.WebhookSubscriptionSnapshot;
import vantaCore.application.webhook.domain.repository.WebhookDeliveryRepositoryInterface;
import vantaCore.application.webhook.domain.repository.WebhookDeliveryRepositoryInterface.WebhookDeliveryPage;
import vantaCore.application.webhook.domain.repository.WebhookSubscriptionRepositoryInterface;
import vantaCore.application.webhook.domain.vo.WebhookSubscriptionId;

import java.util.List;

@Component
final public class ListWebhookDeliveriesQueryHandler
    implements QueryHandlerInterface<ListWebhookDeliveriesQuery, Collection<WebhookDeliveryResult>> {

    private final WebhookSubscriptionRepositoryInterface subscriptionRepository;
    private final WebhookDeliveryRepositoryInterface deliveryRepository;

    public ListWebhookDeliveriesQueryHandler(
        WebhookSubscriptionRepositoryInterface subscriptionRepository,
        WebhookDeliveryRepositoryInterface deliveryRepository
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.deliveryRepository = deliveryRepository;
    }

    @Override
    public Collection<WebhookDeliveryResult> handle(ListWebhookDeliveriesQuery query) {
        WebhookSubscriptionId subscriptionId = new WebhookSubscriptionId(query.getSubscriptionId());

        WebhookSubscriptionSnapshot subscription = this.subscriptionRepository.findById(subscriptionId)
            .orElseThrow(WebhookSubscriptionNotFoundException::new);

        if (!subscription.projectId().equals(query.getProjectId())) {
            throw new WebhookSubscriptionNotFoundException();
        }

        WebhookDeliveryPage page = this.deliveryRepository.findPageBySubscriptionId(subscriptionId.value(), query.getPage(), query.getLimit());

        List<Item<WebhookDeliveryResult>> items = page.items().stream()
            .map(WebhookDeliveryAggregate::toSnapshot)
            .map(delivery -> Item.fromPayload(delivery.id().toString(), toResult(delivery)))
            .toList();

        return new Collection<>(query.getPage(), query.getLimit(), page.total(), items);
    }

    private WebhookDeliveryResult toResult(WebhookDeliverySnapshot delivery) {
        return new WebhookDeliveryResult(
            delivery.id().value(), delivery.eventType(), delivery.statusCode(), delivery.status(), delivery.attempt(), delivery.deliveredAt()
        );
    }
}
