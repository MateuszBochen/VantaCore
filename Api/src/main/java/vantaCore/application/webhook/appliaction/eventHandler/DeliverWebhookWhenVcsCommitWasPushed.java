package vantaCore.application.webhook.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.vcs.domain.event.VcsCommitWasPushed;
import vantaCore.application.webhook.appliaction.service.WebhookDeliveryService;

@Component
public class DeliverWebhookWhenVcsCommitWasPushed implements EventHandlerInterface<VcsCommitWasPushed> {

    private final WebhookDeliveryService deliveryService;

    public DeliverWebhookWhenVcsCommitWasPushed(WebhookDeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @Override
    public Void handle(VcsCommitWasPushed event) {
        this.deliveryService.onVcsCommitPushed(event.projectId(), event.ticketId(), event.branchName());

        return null;
    }
}
