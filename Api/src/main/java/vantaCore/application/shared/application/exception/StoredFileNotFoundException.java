package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class StoredFileNotFoundException extends ClientException {

    public StoredFileNotFoundException() {
        super(List.of(new Notification(
            "file-not-found",
            "File not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
