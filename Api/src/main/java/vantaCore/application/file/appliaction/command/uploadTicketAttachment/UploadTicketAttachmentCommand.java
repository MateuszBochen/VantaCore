package vantaCore.application.file.appliaction.command.uploadTicketAttachment;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.file.appliaction.dto.FileUploadPayload;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.TICKET_MANAGE)
final public class UploadTicketAttachmentCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @NotNull
    private final UUID attachmentId;

    @NotNull
    private final FileUploadPayload payload;

    public UploadTicketAttachmentCommand(UUID projectId, UUID ticketId, UUID attachmentId, FileUploadPayload payload) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.attachmentId = attachmentId;
        this.payload = payload;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public UUID getAttachmentId() {
        return attachmentId;
    }

    public FileUploadPayload getPayload() {
        return payload;
    }
}
