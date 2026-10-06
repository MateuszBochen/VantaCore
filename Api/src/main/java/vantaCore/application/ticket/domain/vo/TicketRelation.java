package vantaCore.application.ticket.domain.vo;

import java.util.UUID;

/** One directional edge of a relation, from the owning ticket's point of view - "this ticket
 {type} relatedTicketId" (e.g. "this ticket BLOCKS relatedTicketId"). The other ticket stores the
 inverse edge itself; see TicketRelationType.inverse() and UpsertTicketCommandHandler's
 relation-sync logic. */
public record TicketRelation(UUID relatedTicketId, TicketRelationType type) {

    public TicketRelation {
        if (relatedTicketId == null) {
            throw new IllegalArgumentException("relatedTicketId cannot be null");
        }
        if (type == null) {
            throw new IllegalArgumentException("type cannot be null");
        }
    }
}
