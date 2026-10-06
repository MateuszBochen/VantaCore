package vantaCore.application.sprint.appliaction.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

// projectId is accepted but not used server-side (the ticket's real projectId is already known via
// TicketAggregateRepositoryInterface) - it's here purely so the frontend can round-trip the same
// shape GET .../sprint returns (see SprintTicketResult) back into this PUT's body unchanged.
final public class SprintTicketRequest {

    @NotNull
    private final UUID ticketId;

    private final UUID projectId;

    public SprintTicketRequest(UUID ticketId, UUID projectId) {
        this.ticketId = ticketId;
        this.projectId = projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public UUID getProjectId() {
        return projectId;
    }
}
