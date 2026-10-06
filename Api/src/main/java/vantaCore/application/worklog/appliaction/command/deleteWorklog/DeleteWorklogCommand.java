package vantaCore.application.worklog.appliaction.command.deleteWorklog;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.shared.domain.audit.Audited;
import vantaCore.application.shared.domain.audit.AuditableCommand;
import vantaCore.application.shared.domain.audit.AuditResourceType;

import java.util.UUID;

@RequiresResource(Resource.WORKLOG_DELETE)
@Audited(AuditResourceType.WORKLOG)
final public class DeleteWorklogCommand implements AuditableCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @NotNull
    private final UUID worklogId;

    public DeleteWorklogCommand(UUID projectId, UUID ticketId, UUID worklogId) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.worklogId = worklogId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public UUID getWorklogId() {
        return worklogId;
    }

    @Override
    public UUID getAuditProjectId() {
        return projectId;
    }

    @Override
    public UUID getAuditResourceId() {
        return worklogId;
    }
}
