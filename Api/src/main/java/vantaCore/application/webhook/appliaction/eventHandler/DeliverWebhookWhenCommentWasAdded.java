package vantaCore.application.webhook.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.comment.domain.event.CommentWasAdded;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.webhook.appliaction.service.WebhookDeliveryService;

@Component
public class DeliverWebhookWhenCommentWasAdded implements EventHandlerInterface<CommentWasAdded> {

    private final WebhookDeliveryService deliveryService;

    public DeliverWebhookWhenCommentWasAdded(WebhookDeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @Override
    public Void handle(CommentWasAdded event) {
        this.deliveryService.onCommentAdded(event.comment(), event.ticket());

        return null;
    }
}
