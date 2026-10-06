package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class SprintNotFoundException extends ClientException {

    public SprintNotFoundException() {
        super(List.of(new Notification(
            "sprint-not-found",
            "Sprint not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
