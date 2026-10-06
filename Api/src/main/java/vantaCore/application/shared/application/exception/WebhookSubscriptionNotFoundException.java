package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class WebhookSubscriptionNotFoundException extends ClientException {

    public WebhookSubscriptionNotFoundException() {
        super(List.of(new Notification(
            "webhook-subscription-not-found",
            "Webhook subscription not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
