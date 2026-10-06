package vantaCore.application.file.appliaction.command.deleteSubProjectAttachment;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.SUBPROJECT_MANAGE)
final public class DeleteSubProjectAttachmentCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID subProjectId;

    @NotNull
    private final UUID attachmentId;

    public DeleteSubProjectAttachmentCommand(UUID projectId, UUID subProjectId, UUID attachmentId) {
        this.projectId = projectId;
        this.subProjectId = subProjectId;
        this.attachmentId = attachmentId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getSubProjectId() {
        return subProjectId;
    }

    public UUID getAttachmentId() {
        return attachmentId;
    }
}
