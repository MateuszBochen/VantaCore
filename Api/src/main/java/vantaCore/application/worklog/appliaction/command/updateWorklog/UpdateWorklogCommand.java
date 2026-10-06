package vantaCore.application.worklog.appliaction.command.updateWorklog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.shared.domain.audit.Audited;
import vantaCore.application.shared.domain.audit.AuditableCommand;
import vantaCore.application.shared.domain.audit.AuditResourceType;
import vantaCore.application.worklog.appliaction.dto.WorklogRequest;

import java.util.UUID;

@RequiresResource(Resource.WORKLOG_UPDATE)
@Audited(AuditResourceType.WORKLOG)
final public class UpdateWorklogCommand implements AuditableCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @NotNull
    private final UUID worklogId;

    @Valid
    @NotNull
    private final WorklogRequest worklogRequest;

    public UpdateWorklogCommand(UUID projectId, UUID ticketId, UUID worklogId, WorklogRequest worklogRequest) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.worklogId = worklogId;
        this.worklogRequest = worklogRequest;
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

    public WorklogRequest getWorklogRequest() {
        return worklogRequest;
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
