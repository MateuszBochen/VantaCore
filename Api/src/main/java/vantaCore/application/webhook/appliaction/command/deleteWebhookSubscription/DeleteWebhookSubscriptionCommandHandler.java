package vantaCore.application.webhook.appliaction.command.deleteWebhookSubscription;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.WebhookSubscriptionNotFoundException;
import vantaCore.application.webhook.domain.WebhookSubscriptionSnapshot;
import vantaCore.application.webhook.domain.repository.WebhookSubscriptionRepositoryInterface;
import vantaCore.application.webhook.domain.vo.WebhookSubscriptionId;

@Component
final public class DeleteWebhookSubscriptionCommandHandler implements CommandHandlerInterface<DeleteWebhookSubscriptionCommand> {

    private final WebhookSubscriptionRepositoryInterface subscriptionRepository;

    public DeleteWebhookSubscriptionCommandHandler(WebhookSubscriptionRepositoryInterface subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override
    public Void handle(DeleteWebhookSubscriptionCommand command) {
        WebhookSubscriptionId subscriptionId = new WebhookSubscriptionId(command.getSubscriptionId());

        WebhookSubscriptionSnapshot subscription = this.subscriptionRepository.findById(subscriptionId)
            .orElseThrow(WebhookSubscriptionNotFoundException::new);

        if (!subscription.projectId().equals(command.getProjectId())) {
            throw new WebhookSubscriptionNotFoundException();
        }

        this.subscriptionRepository.deleteById(subscriptionId);

        return null;
    }
}
