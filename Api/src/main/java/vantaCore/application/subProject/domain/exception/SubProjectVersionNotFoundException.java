package vantaCore.application.subProject.domain.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.ClientException;

import java.util.List;

public class SubProjectVersionNotFoundException extends ClientException {

    public SubProjectVersionNotFoundException() {
        super(List.of(new Notification(
            "sub-project-version-not-found",
            "No earlier sub-project version exists",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
