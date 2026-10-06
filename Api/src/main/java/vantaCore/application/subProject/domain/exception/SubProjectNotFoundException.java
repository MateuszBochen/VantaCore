package vantaCore.application.subProject.domain.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.ClientException;

import java.util.List;

public class SubProjectNotFoundException extends ClientException {

    public SubProjectNotFoundException() {
        super(List.of(new Notification(
            "sub-project-not-found",
            "Sub-project not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
