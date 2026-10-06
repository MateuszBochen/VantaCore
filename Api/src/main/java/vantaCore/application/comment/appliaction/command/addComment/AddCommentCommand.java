package vantaCore.application.comment.appliaction.command.addComment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.comment.appliaction.dto.CommentRequest;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.COMMENT_CREATE)
final public class AddCommentCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @Valid
    @NotNull
    private final CommentRequest commentRequest;

    public AddCommentCommand(UUID projectId, UUID ticketId, CommentRequest commentRequest) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.commentRequest = commentRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public CommentRequest getCommentRequest() {
        return commentRequest;
    }
}
