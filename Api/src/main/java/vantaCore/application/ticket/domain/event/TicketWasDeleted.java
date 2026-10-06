package vantaCore.application.ticket.domain.event;

import java.util.UUID;

/** Minimal, id-only payload - unlike NewTicketWasCreated/TicketWasChanged (which mirror the full
 ticket for the frontend to merge into its state), a deletion just needs enough for a listener to
 remove the ticket from wherever it's showing (list, board, ...); there's no "new state" to mirror. */
public record TicketWasDeleted(UUID ticketId, UUID projectId, String ticketKey) {
}
