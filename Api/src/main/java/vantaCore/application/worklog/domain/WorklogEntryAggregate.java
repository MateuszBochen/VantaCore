package vantaCore.application.worklog.domain;

import vantaCore.application.worklog.domain.vo.WorklogEntryId;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public class WorklogEntryAggregate {
    private final WorklogEntryId id;
    private final UUID ticketId;
    private final UUID userId;
    private final int minutes;
    private final LocalDateTime date;
    private final String note;
    private final Instant createdAt;

    private WorklogEntryAggregate(
        WorklogEntryId id,
        UUID ticketId,
        UUID userId,
        int minutes,
        LocalDateTime date,
        String note,
        Instant createdAt
    ) {
        this.id = id;
        this.ticketId = ticketId;
        this.userId = userId;
        this.minutes = minutes;
        this.date = date;
        this.note = note;
        this.createdAt = createdAt;
    }

    /** A brand-new worklog entry - also used to rebuild one from storage, since id/ticketId/userId/createdAt are supplied either way. */
    public static WorklogEntryAggregate newEntry(
        WorklogEntryId id,
        UUID ticketId,
        UUID userId,
        int minutes,
        LocalDateTime date,
        String note,
        Instant createdAt
    ) {
        return new WorklogEntryAggregate(id, ticketId, userId, minutes, date, note, createdAt);
    }

    /** Corrects minutes/date/note - id/ticketId/userId/createdAt are fixed for the entry's lifetime
     and always carry over from the current instance, never from the caller. */
    public WorklogEntryAggregate changeEntry(int minutes, LocalDateTime date, String note) {
        return new WorklogEntryAggregate(this.id, this.ticketId, this.userId, minutes, date, note, this.createdAt);
    }

    public WorklogEntrySnapshot toSnapshot() {
        return new WorklogEntrySnapshot(id, ticketId, userId, minutes, date, note, createdAt);
    }
}
