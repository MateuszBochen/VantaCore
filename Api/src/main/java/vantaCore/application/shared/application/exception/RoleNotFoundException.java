package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class RoleNotFoundException extends ClientException {

    public RoleNotFoundException() {
        super(List.of(new Notification(
            "role-not-found",
            "Role not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
