package vantaCore.application.file.appliaction.command.deleteTicketAttachment;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.TICKET_MANAGE)
final public class DeleteTicketAttachmentCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @NotNull
    private final UUID attachmentId;

    public DeleteTicketAttachmentCommand(UUID projectId, UUID ticketId, UUID attachmentId) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.attachmentId = attachmentId;
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
}
