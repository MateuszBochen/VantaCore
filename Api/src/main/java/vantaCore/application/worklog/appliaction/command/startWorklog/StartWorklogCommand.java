package vantaCore.application.worklog.appliaction.command.startWorklog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.worklog.appliaction.dto.StartWorklogRequest;

import java.util.UUID;

@RequiresResource(Resource.WORKLOG_START)
final public class StartWorklogCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @Valid
    @NotNull
    private final StartWorklogRequest startWorklogRequest;

    public StartWorklogCommand(UUID projectId, UUID ticketId, StartWorklogRequest startWorklogRequest) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.startWorklogRequest = startWorklogRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public StartWorklogRequest getStartWorklogRequest() {
        return startWorklogRequest;
    }
}
