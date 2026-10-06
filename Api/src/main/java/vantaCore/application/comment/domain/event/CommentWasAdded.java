package vantaCore.application.comment.domain.event;

import vantaCore.application.comment.domain.CommentSnapshot;
import vantaCore.application.ticket.domain.TicketSnapshot;

/** Carries the owning ticket's snapshot too, not just the comment - AddCommentCommandHandler already
 loads the ticket for its existence check, so listeners that need to know who to notify (assignees,
 the ticket's author) don't have to do a second lookup of their own. */
public record CommentWasAdded(CommentSnapshot comment, TicketSnapshot ticket) {
}
