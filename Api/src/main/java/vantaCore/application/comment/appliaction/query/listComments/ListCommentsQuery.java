package vantaCore.application.comment.appliaction.query.listComments;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.COMMENT_VIEW)
final public class ListCommentsQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    public ListCommentsQuery(UUID projectId, UUID ticketId) {
        this.projectId = projectId;
        this.ticketId = ticketId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }
}
