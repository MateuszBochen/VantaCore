package vantaCore.application.worklog.appliaction.query.listWorklog;

import java.time.LocalDateTime;
import java.util.UUID;

public record WorklogResult(
    // Not in the example payload you gave, but the frontend needs it to address
    // PUT/DELETE .../worklog/{worklogId} - added deliberately.
    UUID id,
    int minutes,
    LocalDateTime date,
    String note,
    WorklogActorResult actor
) {
}
