package vantaCore.application.ticket.appliaction.command.propagateEstimate;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

final public class PropagateEstimateCommand {

    @NotNull
    private final UUID ticketId;

    /** signed - the ticket's new estimate minus its previous one */
    @NotNull
    private final Double deltaEstimate;

    public PropagateEstimateCommand(UUID ticketId, Double deltaEstimate) {
        this.ticketId = ticketId;
        this.deltaEstimate = deltaEstimate;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public Double getDeltaEstimate() {
        return deltaEstimate;
    }
}
