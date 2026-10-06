package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public abstract class ClientException extends RuntimeException {
    abstract public HttpStatus  getStatus();

    private final List<Notification> notifications;

    public ClientException(List<Notification> notifications) {
        super(messageOf(notifications));
        this.notifications = List.copyOf(notifications);
    }

    // Without this, every subclass's getMessage() was null - a stack trace logged via
    // log.error("...", exception) (e.g. ImportJobRunner.run's top-level catch) printed
    // "SomeClientException: null" instead of the actual client-facing reason, even though that
    // reason was sitting right there in notifications.
    private static String messageOf(List<Notification> notifications) {
        return notifications.stream()
            .map(Notification::message)
            .reduce((first, second) -> first + "; " + second)
            .orElse(null);
    }

    public List<Notification> getNotifications() {
        return notifications;
    }
}
