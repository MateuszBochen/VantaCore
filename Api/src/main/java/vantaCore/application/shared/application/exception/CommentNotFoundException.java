package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class CommentNotFoundException extends ClientException {

    public CommentNotFoundException() {
        super(List.of(new Notification(
            "comment-not-found",
            "Comment not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
