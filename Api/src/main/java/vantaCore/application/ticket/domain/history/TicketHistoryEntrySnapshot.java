package vantaCore.application.ticket.domain.history;

import java.time.Instant;
import java.util.UUID;

public record TicketHistoryEntrySnapshot(
    UUID id,
    UUID ticketId,
    UUID changedByUserId,
    String changedByEmail,
    Instant changedAt,
    TicketHistorySnapshot ticket
) {
}
