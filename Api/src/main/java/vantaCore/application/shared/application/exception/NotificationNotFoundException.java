package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class NotificationNotFoundException extends ClientException {

    public NotificationNotFoundException() {
        super(List.of(new Notification(
            "notification-not-found",
            "Notification not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
