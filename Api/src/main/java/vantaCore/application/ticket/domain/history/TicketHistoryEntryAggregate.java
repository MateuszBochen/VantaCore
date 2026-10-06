package vantaCore.application.ticket.domain.history;

import java.time.Instant;
import java.util.UUID;

/** Write-once - unlike every other aggregate in this codebase, a history entry is never edited or
 deleted after creation, so there's no changeX() counterpart to newEntry(). */
public class TicketHistoryEntryAggregate {
    private final UUID id;
    private final UUID ticketId;
    private final UUID changedByUserId;
    private final String changedByEmail;
    private final Instant changedAt;
    private final TicketHistorySnapshot ticket;

    private TicketHistoryEntryAggregate(
        UUID id,
        UUID ticketId,
        UUID changedByUserId,
        String changedByEmail,
        Instant changedAt,
        TicketHistorySnapshot ticket
    ) {
        this.id = id;
        this.ticketId = ticketId;
        this.changedByUserId = changedByUserId;
        this.changedByEmail = changedByEmail;
        this.changedAt = changedAt;
        this.ticket = ticket;
    }

    public static TicketHistoryEntryAggregate newEntry(
        UUID id,
        UUID ticketId,
        UUID changedByUserId,
        String changedByEmail,
        Instant changedAt,
        TicketHistorySnapshot ticket
    ) {
        return new TicketHistoryEntryAggregate(id, ticketId, changedByUserId, changedByEmail, changedAt, ticket);
    }

    public TicketHistoryEntrySnapshot toSnapshot() {
        return new TicketHistoryEntrySnapshot(id, ticketId, changedByUserId, changedByEmail, changedAt, ticket);
    }
}
