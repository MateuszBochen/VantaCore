package vantaCore.application.webhook.appliaction.command.updateWebhookSubscription;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.WebhookSubscriptionNotFoundException;
import vantaCore.application.webhook.appliaction.dto.UpdateWebhookSubscriptionRequest;
import vantaCore.application.webhook.domain.WebhookSubscriptionAggregate;
import vantaCore.application.webhook.domain.WebhookSubscriptionSnapshot;
import vantaCore.application.webhook.domain.repository.WebhookSubscriptionRepositoryInterface;
import vantaCore.application.webhook.domain.vo.WebhookSubscriptionId;

@Component
final public class UpdateWebhookSubscriptionCommandHandler implements CommandHandlerInterface<UpdateWebhookSubscriptionCommand> {

    private final WebhookSubscriptionRepositoryInterface subscriptionRepository;

    public UpdateWebhookSubscriptionCommandHandler(WebhookSubscriptionRepositoryInterface subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override
    public Void handle(UpdateWebhookSubscriptionCommand command) {
        WebhookSubscriptionId subscriptionId = new WebhookSubscriptionId(command.getSubscriptionId());

        WebhookSubscriptionSnapshot snapshot = this.subscriptionRepository.findById(subscriptionId)
            .orElseThrow(WebhookSubscriptionNotFoundException::new);

        if (!snapshot.projectId().equals(command.getProjectId())) {
            throw new WebhookSubscriptionNotFoundException();
        }

        UpdateWebhookSubscriptionRequest request = command.getUpdateWebhookSubscriptionRequest();

        WebhookSubscriptionAggregate subscription = WebhookSubscriptionAggregate.newSubscription(
            snapshot.id(), snapshot.projectId(), snapshot.eventTypes(), snapshot.targetType(), snapshot.targetUrl(),
            snapshot.secret(), snapshot.enabled(), snapshot.createdByUserId(), snapshot.createdAt()
        ).changeSubscription(request.getEventTypes(), request.getTargetUrl(), request.getEnabled());

        this.subscriptionRepository.save(subscription);

        return null;
    }
}
