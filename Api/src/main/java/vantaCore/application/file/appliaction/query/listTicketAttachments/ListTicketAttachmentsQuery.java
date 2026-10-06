package vantaCore.application.file.appliaction.query.listTicketAttachments;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.TICKET_VIEW)
final public class ListTicketAttachmentsQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    public ListTicketAttachmentsQuery(UUID projectId, UUID ticketId) {
        this.projectId = projectId;
        this.ticketId = ticketId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }
}
