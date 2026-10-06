package vantaCore.application.project.appliaction.query.getProject;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.PROJECT_VIEW)
final public class GetProjectQuery {

    @NotNull
    private final UUID projectId;

    public GetProjectQuery(UUID projectId) {
        this.projectId = projectId;
    }

    public UUID getProjectId() {
        return projectId;
    }
}
