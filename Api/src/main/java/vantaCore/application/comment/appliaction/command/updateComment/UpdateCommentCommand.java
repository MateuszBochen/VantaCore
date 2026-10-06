package vantaCore.application.comment.appliaction.command.updateComment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.comment.appliaction.dto.CommentRequest;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.shared.domain.audit.Audited;
import vantaCore.application.shared.domain.audit.AuditableCommand;
import vantaCore.application.shared.domain.audit.AuditResourceType;

import java.util.UUID;

@RequiresResource(Resource.COMMENT_UPDATE)
@Audited(AuditResourceType.COMMENT)
final public class UpdateCommentCommand implements AuditableCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @NotNull
    private final UUID commentId;

    @Valid
    @NotNull
    private final CommentRequest commentRequest;

    public UpdateCommentCommand(UUID projectId, UUID ticketId, UUID commentId, CommentRequest commentRequest) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.commentId = commentId;
        this.commentRequest = commentRequest;
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

    public CommentRequest getCommentRequest() {
        return commentRequest;
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
