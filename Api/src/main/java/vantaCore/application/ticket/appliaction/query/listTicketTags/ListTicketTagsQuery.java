package vantaCore.application.ticket.appliaction.query.listTicketTags;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.TICKET_VIEW)
final public class ListTicketTagsQuery {

    @NotNull
    private final UUID projectId;

    public ListTicketTagsQuery(UUID projectId) {
        this.projectId = projectId;
    }

    public UUID getProjectId() {
        return projectId;
    }
}
