package vantaCore.application.vcs.appliaction.query.getDevelopmentActivity;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.DEVELOPMENT_VIEW)
final public class GetDevelopmentActivityQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    public GetDevelopmentActivityQuery(UUID projectId, UUID ticketId) {
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
