package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class TicketVersionNotFoundException extends ClientException {

    public TicketVersionNotFoundException() {
        super(List.of(new Notification(
            "ticket-version-not-found",
            "No ticket version found before the given timestamp",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
