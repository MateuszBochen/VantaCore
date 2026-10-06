package vantaCore.application.worklog.appliaction.query.listWorklog;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.WORKLOG_VIEW)
final public class ListWorklogQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    public ListWorklogQuery(UUID projectId, UUID ticketId) {
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
