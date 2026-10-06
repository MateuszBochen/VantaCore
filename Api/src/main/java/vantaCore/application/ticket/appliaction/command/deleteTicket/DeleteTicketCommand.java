package vantaCore.application.ticket.appliaction.command.deleteTicket;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.shared.domain.audit.Audited;
import vantaCore.application.shared.domain.audit.AuditableCommand;
import vantaCore.application.shared.domain.audit.AuditResourceType;

import java.util.UUID;

@RequiresResource(Resource.TICKET_DELETE)
@Audited(AuditResourceType.TICKET)
final public class DeleteTicketCommand implements AuditableCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    public DeleteTicketCommand(UUID projectId, UUID ticketId) {
        this.projectId = projectId;
        this.ticketId = ticketId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    @Override
    public UUID getAuditProjectId() {
        return projectId;
    }

    @Override
    public UUID getAuditResourceId() {
        return ticketId;
    }
}
