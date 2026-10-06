package vantaCore.application.webhook.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.vcs.domain.event.VcsBranchWasCreated;
import vantaCore.application.webhook.appliaction.service.WebhookDeliveryService;

@Component
public class DeliverWebhookWhenVcsBranchWasCreated implements EventHandlerInterface<VcsBranchWasCreated> {

    private final WebhookDeliveryService deliveryService;

    public DeliverWebhookWhenVcsBranchWasCreated(WebhookDeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @Override
    public Void handle(VcsBranchWasCreated event) {
        this.deliveryService.onVcsBranchCreated(event.projectId(), event.ticketId(), event.branchName());

        return null;
    }
}
