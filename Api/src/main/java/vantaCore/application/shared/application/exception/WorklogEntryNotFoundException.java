package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class WorklogEntryNotFoundException extends ClientException {

    public WorklogEntryNotFoundException() {
        super(List.of(new Notification(
            "worklog-entry-not-found",
            "Worklog entry not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
