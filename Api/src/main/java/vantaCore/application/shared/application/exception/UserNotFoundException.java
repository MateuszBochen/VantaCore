package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class UserNotFoundException extends ClientException {

    public UserNotFoundException() {
        super(List.of(new Notification(
            "user-not-found",
            "User not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
