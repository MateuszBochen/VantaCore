package vantaCore.application.documentation.platform.appliaction.query.getPreviousPlatformDocumentationVersion;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.time.Instant;
import java.util.UUID;

@RequiresResource(Resource.DOCUMENTATION_VIEW)
final public class GetPreviousPlatformDocumentationVersionQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final Instant before;

    public GetPreviousPlatformDocumentationVersionQuery(UUID projectId, Instant before) {
        this.projectId = projectId;
        this.before = before;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public Instant getBefore() {
        return before;
    }
}
