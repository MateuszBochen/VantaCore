package vantaCore.application.ticket.domain.event;

import vantaCore.application.ticket.domain.TicketSnapshot;

import java.util.UUID;

/** Fired only on a genuine statusId transition, diffed inside UpsertTicketCommandHandler (this
 event alone can't tell "just changed" from "always was this status", same reason
 UsersWereMentionedInTicket exists instead of relying on TicketWasChanged). Not dispatched for a
 brand-new ticket (see NewTicketWasCreated) or a save that leaves statusId untouched. */
public record TicketStatusWasChanged(TicketSnapshot ticket, UUID previousStatusId) {
}
