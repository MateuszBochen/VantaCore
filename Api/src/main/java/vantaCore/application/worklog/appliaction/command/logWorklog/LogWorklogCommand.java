package vantaCore.application.worklog.appliaction.command.logWorklog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.worklog.appliaction.dto.WorklogRequest;

import java.util.UUID;

@RequiresResource(Resource.WORKLOG_LOG)
final public class LogWorklogCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @Valid
    @NotNull
    private final WorklogRequest worklogRequest;

    public LogWorklogCommand(UUID projectId, UUID ticketId, WorklogRequest worklogRequest) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.worklogRequest = worklogRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public WorklogRequest getWorklogRequest() {
        return worklogRequest;
    }
}
