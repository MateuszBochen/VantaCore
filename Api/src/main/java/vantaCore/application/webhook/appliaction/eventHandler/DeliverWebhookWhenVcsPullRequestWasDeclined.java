package vantaCore.application.webhook.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.vcs.domain.event.VcsPullRequestWasDeclined;
import vantaCore.application.webhook.appliaction.service.WebhookDeliveryService;

@Component
public class DeliverWebhookWhenVcsPullRequestWasDeclined implements EventHandlerInterface<VcsPullRequestWasDeclined> {

    private final WebhookDeliveryService deliveryService;

    public DeliverWebhookWhenVcsPullRequestWasDeclined(WebhookDeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @Override
    public Void handle(VcsPullRequestWasDeclined event) {
        this.deliveryService.onVcsPullRequestDeclined(event.projectId(), event.ticketId(), event.pullRequestId(), event.title());

        return null;
    }
}
