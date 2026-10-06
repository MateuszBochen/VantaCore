package vantaCore.application.webhook.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.ticket.domain.event.TicketFieldWasChanged;
import vantaCore.application.webhook.appliaction.service.WebhookDeliveryService;

@Component
public class DeliverWebhookWhenTicketFieldWasChanged implements EventHandlerInterface<TicketFieldWasChanged> {

    private final WebhookDeliveryService deliveryService;

    public DeliverWebhookWhenTicketFieldWasChanged(WebhookDeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @Override
    public Void handle(TicketFieldWasChanged event) {
        this.deliveryService.onTicketFieldChanged(event.ticket(), event.fieldId());

        return null;
    }
}
