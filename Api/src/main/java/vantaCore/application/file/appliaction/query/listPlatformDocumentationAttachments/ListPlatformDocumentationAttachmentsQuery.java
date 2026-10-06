package vantaCore.application.file.appliaction.query.listPlatformDocumentationAttachments;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.DOCUMENTATION_VIEW)
final public class ListPlatformDocumentationAttachmentsQuery {

    @NotNull
    private final UUID projectId;

    public ListPlatformDocumentationAttachmentsQuery(UUID projectId) {
        this.projectId = projectId;
    }

    public UUID getProjectId() {
        return projectId;
    }
}
