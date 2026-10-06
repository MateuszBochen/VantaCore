package vantaCore.application.subProject.appliaction.query.listSubProjects;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.SUBPROJECT_VIEW)
final public class ListSubProjectsQuery {

    @NotNull
    private final UUID projectId;

    public ListSubProjectsQuery(UUID projectId) {
        this.projectId = projectId;
    }

    public UUID getProjectId() {
        return projectId;
    }
}
