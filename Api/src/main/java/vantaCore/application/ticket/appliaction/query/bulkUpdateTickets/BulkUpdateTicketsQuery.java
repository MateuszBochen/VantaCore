package vantaCore.application.ticket.appliaction.query.bulkUpdateTickets;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.ticket.appliaction.dto.BulkTicketActionRequest;

import java.util.UUID;

// TICKET_VIEW is only a coarse early gate here - the REAL per-action permission (ticket:manage for
// every action except DELETE, ticket:delete for DELETE) is enforced per item, by whichever command
// each ticket ends up dispatched through (see BulkUpdateTicketsQueryHandler). A single request only
// ever carries one action type, but @RequiresResource can't vary by that at the class level, and
// the two possible requirements are different resources - so the strict check happens per-item
// instead of here, same "one source of truth, no bulk-only rules" principle as the rest of this
// feature.
@RequiresResource(Resource.TICKET_VIEW)
final public class BulkUpdateTicketsQuery {

    @NotNull
    private final UUID projectId;

    @Valid
    @NotNull
    private final BulkTicketActionRequest bulkTicketActionRequest;

    public BulkUpdateTicketsQuery(UUID projectId, BulkTicketActionRequest bulkTicketActionRequest) {
        this.projectId = projectId;
        this.bulkTicketActionRequest = bulkTicketActionRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public BulkTicketActionRequest getBulkTicketActionRequest() {
        return bulkTicketActionRequest;
    }
}
