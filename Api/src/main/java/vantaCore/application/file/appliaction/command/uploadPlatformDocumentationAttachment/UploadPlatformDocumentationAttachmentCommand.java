package vantaCore.application.file.appliaction.command.uploadPlatformDocumentationAttachment;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.file.appliaction.dto.FileUploadPayload;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.DOCUMENTATION_UPDATE)
final public class UploadPlatformDocumentationAttachmentCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID attachmentId;

    @NotNull
    private final FileUploadPayload payload;

    public UploadPlatformDocumentationAttachmentCommand(UUID projectId, UUID attachmentId, FileUploadPayload payload) {
        this.projectId = projectId;
        this.attachmentId = attachmentId;
        this.payload = payload;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getAttachmentId() {
        return attachmentId;
    }

    public FileUploadPayload getPayload() {
        return payload;
    }
}
