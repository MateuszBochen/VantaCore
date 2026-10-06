package vantaCore.application.ticket.appliaction.query.getProjectStats;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

// Reuses TICKET_VIEW rather than a dedicated stats:view resource - this is entirely derived from
// ticket data, same visibility question as "can this caller see this project's tickets at all".
@RequiresResource(Resource.TICKET_VIEW)
final public class GetProjectStatsQuery {

    @NotNull
    private final UUID projectId;

    public GetProjectStatsQuery(UUID projectId) {
        this.projectId = projectId;
    }

    public UUID getProjectId() {
        return projectId;
    }
}
