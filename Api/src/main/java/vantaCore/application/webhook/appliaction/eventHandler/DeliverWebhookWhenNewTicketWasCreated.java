package vantaCore.application.webhook.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.ticket.domain.event.NewTicketWasCreated;
import vantaCore.application.webhook.appliaction.service.WebhookDeliveryService;

@Component
public class DeliverWebhookWhenNewTicketWasCreated implements EventHandlerInterface<NewTicketWasCreated> {

    private final WebhookDeliveryService deliveryService;

    public DeliverWebhookWhenNewTicketWasCreated(WebhookDeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @Override
    public Void handle(NewTicketWasCreated event) {
        this.deliveryService.onTicketCreated(event.ticket());

        return null;
    }
}
