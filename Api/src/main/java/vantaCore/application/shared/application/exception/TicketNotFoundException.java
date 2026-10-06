package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class TicketNotFoundException extends ClientException {

    public TicketNotFoundException() {
        super(List.of(new Notification(
            "ticket-not-found",
            "Ticket not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
