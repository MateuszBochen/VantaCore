package vantaCore.application.webhook.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.vcs.domain.event.VcsPullRequestWasMerged;
import vantaCore.application.webhook.appliaction.service.WebhookDeliveryService;

@Component
public class DeliverWebhookWhenVcsPullRequestWasMerged implements EventHandlerInterface<VcsPullRequestWasMerged> {

    private final WebhookDeliveryService deliveryService;

    public DeliverWebhookWhenVcsPullRequestWasMerged(WebhookDeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @Override
    public Void handle(VcsPullRequestWasMerged event) {
        this.deliveryService.onVcsPullRequestMerged(event.projectId(), event.ticketId(), event.pullRequestId(), event.title());

        return null;
    }
}
