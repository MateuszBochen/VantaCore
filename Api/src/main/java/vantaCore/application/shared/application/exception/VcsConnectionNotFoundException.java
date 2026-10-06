package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class VcsConnectionNotFoundException extends ClientException {

    public VcsConnectionNotFoundException() {
        super(List.of(new Notification(
            "vcs-connection-not-found",
            "VCS connection not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
