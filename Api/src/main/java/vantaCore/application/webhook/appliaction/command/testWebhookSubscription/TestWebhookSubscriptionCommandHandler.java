package vantaCore.application.webhook.appliaction.command.testWebhookSubscription;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.WebhookSubscriptionNotFoundException;
import vantaCore.application.webhook.appliaction.service.WebhookDeliveryService;
import vantaCore.application.webhook.domain.WebhookSubscriptionSnapshot;
import vantaCore.application.webhook.domain.repository.WebhookSubscriptionRepositoryInterface;
import vantaCore.application.webhook.domain.vo.WebhookSubscriptionId;

@Component
final public class TestWebhookSubscriptionCommandHandler implements CommandHandlerInterface<TestWebhookSubscriptionCommand> {

    private final WebhookSubscriptionRepositoryInterface subscriptionRepository;
    private final WebhookDeliveryService deliveryService;

    public TestWebhookSubscriptionCommandHandler(
        WebhookSubscriptionRepositoryInterface subscriptionRepository,
        WebhookDeliveryService deliveryService
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.deliveryService = deliveryService;
    }

    @Override
    public Void handle(TestWebhookSubscriptionCommand command) {
        WebhookSubscriptionId subscriptionId = new WebhookSubscriptionId(command.getSubscriptionId());

        WebhookSubscriptionSnapshot subscription = this.subscriptionRepository.findById(subscriptionId)
            .orElseThrow(WebhookSubscriptionNotFoundException::new);

        if (!subscription.projectId().equals(command.getProjectId())) {
            throw new WebhookSubscriptionNotFoundException();
        }

        this.deliveryService.deliverTest(subscription);

        return null;
    }
}
