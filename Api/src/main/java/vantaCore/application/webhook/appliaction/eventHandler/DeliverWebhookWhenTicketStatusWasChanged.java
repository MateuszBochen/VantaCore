package vantaCore.application.webhook.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.ticket.domain.event.TicketStatusWasChanged;
import vantaCore.application.webhook.appliaction.service.WebhookDeliveryService;

@Component
public class DeliverWebhookWhenTicketStatusWasChanged implements EventHandlerInterface<TicketStatusWasChanged> {

    private final WebhookDeliveryService deliveryService;

    public DeliverWebhookWhenTicketStatusWasChanged(WebhookDeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @Override
    public Void handle(TicketStatusWasChanged event) {
        this.deliveryService.onTicketStatusChanged(event.ticket(), event.previousStatusId());

        return null;
    }
}
