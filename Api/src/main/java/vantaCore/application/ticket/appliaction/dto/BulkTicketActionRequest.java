package vantaCore.application.ticket.appliaction.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

final public class BulkTicketActionRequest {

    @NotEmpty
    private final List<UUID> ticketIds;

    @Valid
    @NotNull
    private final BulkActionRequest action;

    public BulkTicketActionRequest(List<UUID> ticketIds, BulkActionRequest action) {
        this.ticketIds = ticketIds;
        this.action = action;
    }

    public List<UUID> getTicketIds() {
        return ticketIds;
    }

    public BulkActionRequest getAction() {
        return action;
    }
}
