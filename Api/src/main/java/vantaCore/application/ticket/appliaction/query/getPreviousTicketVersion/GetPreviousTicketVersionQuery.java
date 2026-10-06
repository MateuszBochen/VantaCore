package vantaCore.application.ticket.appliaction.query.getPreviousTicketVersion;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.time.Instant;
import java.util.UUID;

@RequiresResource(Resource.TICKET_VIEW)
final public class GetPreviousTicketVersionQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @NotNull
    private final Instant before;

    public GetPreviousTicketVersionQuery(UUID projectId, UUID ticketId, Instant before) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.before = before;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public Instant getBefore() {
        return before;
    }
}
