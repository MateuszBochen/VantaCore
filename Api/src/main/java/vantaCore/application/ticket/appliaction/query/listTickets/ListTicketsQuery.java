package vantaCore.application.ticket.appliaction.query.listTickets;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.TICKET_VIEW)
final public class ListTicketsQuery {

    @NotNull
    private final UUID projectId;

    /** null = root tickets only (no parent), non-null = direct children of this ticket */
    private final UUID parentId;

    @Min(0)
    private final int page;

    @Min(1)
    private final int limit;

    public ListTicketsQuery(UUID projectId, UUID parentId, int page, int limit) {
        this.projectId = projectId;
        this.parentId = parentId;
        this.page = page;
        this.limit = limit;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getParentId() {
        return parentId;
    }

    public int getPage() {
        return page;
    }

    public int getLimit() {
        return limit;
    }
}
