package vantaCore.application.comment.appliaction.command.deleteComment;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.shared.domain.audit.Audited;
import vantaCore.application.shared.domain.audit.AuditableCommand;
import vantaCore.application.shared.domain.audit.AuditResourceType;

import java.util.UUID;

@RequiresResource(Resource.COMMENT_DELETE)
@Audited(AuditResourceType.COMMENT)
final public class DeleteCommentCommand implements AuditableCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @NotNull
    private final UUID commentId;

    public DeleteCommentCommand(UUID projectId, UUID ticketId, UUID commentId) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.commentId = commentId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public UUID getCommentId() {
        return commentId;
    }

    @Override
    public UUID getAuditProjectId() {
        return projectId;
    }

    @Override
    public UUID getAuditResourceId() {
        return commentId;
    }
}
