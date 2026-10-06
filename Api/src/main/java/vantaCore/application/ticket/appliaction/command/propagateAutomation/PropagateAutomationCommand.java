package vantaCore.application.ticket.appliaction.command.propagateAutomation;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** Internal, self-dispatched only (see UpsertTicketCommandHandler) - never reachable directly from
 a controller, so no @RequiresResource. */
final public class PropagateAutomationCommand {

    @NotNull
    private final UUID ticketId;

    public PropagateAutomationCommand(UUID ticketId) {
        this.ticketId = ticketId;
    }

    public UUID getTicketId() {
        return ticketId;
    }
}
