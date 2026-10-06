package vantaCore.application.ticket.appliaction.query.getTicket;

import vantaCore.application.ticket.domain.vo.TicketRelationType;

import java.util.UUID;

public record TicketRelatedTicketResult(
    UUID ticketId,
    TicketRelationType type,
    String key,
    String title,
    UUID projectId
) {
}
