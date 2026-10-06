package vantaCore.application.sprint.appliaction.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

final public class SprintTicketActionRequest {

    @NotNull
    private final UUID ticketId;

    @NotNull
    private final SprintTicketAction action;

    public SprintTicketActionRequest(UUID ticketId, SprintTicketAction action) {
        this.ticketId = ticketId;
        this.action = action;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public SprintTicketAction getAction() {
        return action;
    }
}
