package vantaCore.application.worklog.domain;

import vantaCore.application.worklog.domain.vo.WorklogEntryId;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record WorklogEntrySnapshot(
    WorklogEntryId id,
    UUID ticketId,
    UUID userId,
    int minutes,
    LocalDateTime date,
    String note,
    Instant createdAt
) {
}
