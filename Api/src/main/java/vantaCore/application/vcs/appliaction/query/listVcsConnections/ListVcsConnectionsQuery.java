package vantaCore.application.vcs.appliaction.query.listVcsConnections;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.VCS_CONNECTION_VIEW)
final public class ListVcsConnectionsQuery {

    @NotNull
    private final UUID projectId;

    public ListVcsConnectionsQuery(UUID projectId) {
        this.projectId = projectId;
    }

    public UUID getProjectId() {
        return projectId;
    }
}
