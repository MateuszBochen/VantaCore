package vantaCore.application.ticket.appliaction.query.getTicket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.TICKET_VIEW)
final public class GetTicketQuery {

    @NotNull
    private final UUID projectId;

    /** either the ticket's id (UUID) or its key (e.g. "VC-1000") - see GetTicketQueryHandler.resolveTicket */
    @NotBlank
    private final String ticketIdentifier;

    public GetTicketQuery(UUID projectId, String ticketIdentifier) {
        this.projectId = projectId;
        this.ticketIdentifier = ticketIdentifier;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public String getTicketIdentifier() {
        return ticketIdentifier;
    }
}
