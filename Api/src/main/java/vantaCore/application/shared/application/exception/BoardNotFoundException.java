package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class BoardNotFoundException extends ClientException {

    public BoardNotFoundException() {
        super(List.of(new Notification(
            "board-not-found",
            "Board not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
