package vantaCore.application.file.appliaction.command.uploadSubProjectAttachment;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.file.appliaction.dto.FileUploadPayload;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.SUBPROJECT_MANAGE)
final public class UploadSubProjectAttachmentCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID subProjectId;

    @NotNull
    private final UUID attachmentId;

    @NotNull
    private final FileUploadPayload payload;

    public UploadSubProjectAttachmentCommand(UUID projectId, UUID subProjectId, UUID attachmentId, FileUploadPayload payload) {
        this.projectId = projectId;
        this.subProjectId = subProjectId;
        this.attachmentId = attachmentId;
        this.payload = payload;
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

    public FileUploadPayload getPayload() {
        return payload;
    }
}
