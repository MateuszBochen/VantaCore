package vantaCore.application.ticket.appliaction.command.propagateTimeSpent;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

final public class PropagateTimeSpentCommand {

    @NotNull
    private final UUID ticketId;

    /** signed - positive for a new/increased worklog entry, negative for a reduced/deleted one */
    @NotNull
    private final Integer deltaMinutes;

    public PropagateTimeSpentCommand(UUID ticketId, Integer deltaMinutes) {
        this.ticketId = ticketId;
        this.deltaMinutes = deltaMinutes;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public Integer getDeltaMinutes() {
        return deltaMinutes;
    }
}
