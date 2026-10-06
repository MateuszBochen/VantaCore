package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.List;

public class ForbiddenException extends ClientException {

    public ForbiddenException(Resource resource) {
        super(List.of(new Notification(
            "forbidden",
            "Missing required permission: " + resource.getCode(),
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.FORBIDDEN;
    }
}
