package vantaCore.application.subProject.appliaction.query.getSubProject;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.SUBPROJECT_VIEW)
final public class GetSubProjectQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID subProjectId;

    public GetSubProjectQuery(UUID projectId, UUID subProjectId) {
        this.projectId = projectId;
        this.subProjectId = subProjectId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getSubProjectId() {
        return subProjectId;
    }
}
