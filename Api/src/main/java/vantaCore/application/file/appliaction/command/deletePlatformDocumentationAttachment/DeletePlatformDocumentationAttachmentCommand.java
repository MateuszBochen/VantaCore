package vantaCore.application.file.appliaction.command.deletePlatformDocumentationAttachment;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.DOCUMENTATION_UPDATE)
final public class DeletePlatformDocumentationAttachmentCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID attachmentId;

    public DeletePlatformDocumentationAttachmentCommand(UUID projectId, UUID attachmentId) {
        this.projectId = projectId;
        this.attachmentId = attachmentId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getAttachmentId() {
        return attachmentId;
    }
}
