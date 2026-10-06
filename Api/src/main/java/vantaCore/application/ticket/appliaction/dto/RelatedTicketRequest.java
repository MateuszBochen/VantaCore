package vantaCore.application.ticket.appliaction.dto;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.ticket.domain.vo.TicketRelationType;

import java.util.UUID;

// key/title/projectId aren't accepted here (only ticketId+type are meaningful on write) but the
// frontend can still send GET's full relatedTickets shape unchanged - Spring's default ObjectMapper
// ignores unrecognized properties, same round-trip convenience as SprintTicketRequest's unused
// projectId field.
final public class RelatedTicketRequest {

    @NotNull
    private final UUID ticketId;

    @NotNull
    private final TicketRelationType type;

    public RelatedTicketRequest(UUID ticketId, TicketRelationType type) {
        this.ticketId = ticketId;
        this.type = type;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public TicketRelationType getType() {
        return type;
    }
}
