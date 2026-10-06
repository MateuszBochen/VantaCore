package vantaCore.application.ticket.appliaction.command.upsertTicket;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.shared.domain.audit.Audited;
import vantaCore.application.shared.domain.audit.AuditableCommand;
import vantaCore.application.shared.domain.audit.AuditResourceType;
import vantaCore.application.ticket.appliaction.dto.UpsertTicketRequest;

import java.util.UUID;

@RequiresResource(Resource.TICKET_MANAGE)
@Audited(AuditResourceType.TICKET)
final public class UpsertTicketCommand implements AuditableCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @Valid
    @NotNull
    private final UpsertTicketRequest upsertTicketRequest;

    public UpsertTicketCommand(UUID projectId, UUID ticketId, UpsertTicketRequest upsertTicketRequest) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.upsertTicketRequest = upsertTicketRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public UpsertTicketRequest getUpsertTicketRequest() {
        return upsertTicketRequest;
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
