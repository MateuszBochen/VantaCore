package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class ProjectNotFoundException extends ClientException {

    public ProjectNotFoundException() {
        super(List.of(new Notification(
            "project-not-found",
            "Project not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
