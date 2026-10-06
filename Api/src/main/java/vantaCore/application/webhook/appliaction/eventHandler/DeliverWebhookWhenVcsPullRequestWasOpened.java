package vantaCore.application.webhook.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.vcs.domain.event.VcsPullRequestWasOpened;
import vantaCore.application.webhook.appliaction.service.WebhookDeliveryService;

@Component
public class DeliverWebhookWhenVcsPullRequestWasOpened implements EventHandlerInterface<VcsPullRequestWasOpened> {

    private final WebhookDeliveryService deliveryService;

    public DeliverWebhookWhenVcsPullRequestWasOpened(WebhookDeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @Override
    public Void handle(VcsPullRequestWasOpened event) {
        this.deliveryService.onVcsPullRequestOpened(event.projectId(), event.ticketId(), event.pullRequestId(), event.title());

        return null;
    }
}
