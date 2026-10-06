package vantaCore.application.subProject.appliaction.query.getPreviousSubProjectVersion;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.time.Instant;
import java.util.UUID;

@RequiresResource(Resource.SUBPROJECT_VIEW)
final public class GetPreviousSubProjectVersionQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID subProjectId;

    @NotNull
    private final Instant before;

    public GetPreviousSubProjectVersionQuery(UUID projectId, UUID subProjectId, Instant before) {
        this.projectId = projectId;
        this.subProjectId = subProjectId;
        this.before = before;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getSubProjectId() {
        return subProjectId;
    }

    public Instant getBefore() {
        return before;
    }
}
