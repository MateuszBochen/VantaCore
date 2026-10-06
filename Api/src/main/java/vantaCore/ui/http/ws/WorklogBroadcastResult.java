package vantaCore.ui.http.ws;

import vantaCore.application.worklog.domain.WorklogEntrySnapshot;

import java.time.LocalDateTime;
import java.util.UUID;

/** Wire shape pushed over WebSocket for worklog create/change events. */
record WorklogBroadcastResult(
    UUID id,
    UUID ticketId,
    int minutes,
    LocalDateTime date,
    String note,
    UUID actorId
) {
    static WorklogBroadcastResult from(WorklogEntrySnapshot snapshot) {
        return new WorklogBroadcastResult(
            snapshot.id().value(),
            snapshot.ticketId(),
            snapshot.minutes(),
            snapshot.date(),
            snapshot.note(),
            snapshot.userId()
        );
    }
}
