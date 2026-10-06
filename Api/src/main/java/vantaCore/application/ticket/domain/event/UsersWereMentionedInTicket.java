package vantaCore.application.ticket.domain.event;

import vantaCore.application.ticket.domain.TicketSnapshot;

import java.util.Set;
import java.util.UUID;

/** Fired only for NEWLY added @mentions in a ticket's description - the diff against the previous
 save happens inside UpsertTicketCommandHandler (this event alone can't tell "just added" from
 "was already there", same reason NewTicketWasCreated/TicketWasChanged are separate events rather
 than one carrying an isNew flag). Editing/resaving a ticket must not re-notify for a mention that
 was already in the description. Not dispatched at all when there are no new mentions.

 Carries mentionedByUserId (the ticket editor) directly rather than having a listener re-derive it
 from CurrentUserProviderInterface, same reasoning CommentWasAdded carries comment.authorId(). */
public record UsersWereMentionedInTicket(TicketSnapshot ticket, Set<UUID> mentionedUserIds, UUID mentionedByUserId) {
}
