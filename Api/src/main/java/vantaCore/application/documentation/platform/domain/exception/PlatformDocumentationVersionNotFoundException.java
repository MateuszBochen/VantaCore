package vantaCore.application.documentation.platform.domain.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.ClientException;

import java.util.List;

public class PlatformDocumentationVersionNotFoundException extends ClientException {

    public PlatformDocumentationVersionNotFoundException() {
        super(List.of(new Notification(
            "platform-documentation-version-not-found",
            "No earlier documentation version exists",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
