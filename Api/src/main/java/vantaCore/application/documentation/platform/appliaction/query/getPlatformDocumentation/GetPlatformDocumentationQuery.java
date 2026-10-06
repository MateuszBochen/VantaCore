package vantaCore.application.documentation.platform.appliaction.query.getPlatformDocumentation;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.DOCUMENTATION_VIEW)
final public class GetPlatformDocumentationQuery {

    @NotNull
    private final UUID projectId;

    public GetPlatformDocumentationQuery(UUID projectId) {
        this.projectId = projectId;
    }

    public UUID getProjectId() {
        return projectId;
    }
}
