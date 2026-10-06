package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class AccessTokenNotFoundException extends ClientException {

    public AccessTokenNotFoundException() {
        super(List.of(new Notification(
            "access-token-not-found",
            "Access token not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
