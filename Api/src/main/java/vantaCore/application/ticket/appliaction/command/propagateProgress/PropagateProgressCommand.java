package vantaCore.application.ticket.appliaction.command.propagateProgress;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** ticketId is the first ANCESTOR to recompute, not the ticket whose status/children actually
 changed - the caller (UpsertTicketCommandHandler/DeleteTicketCommandHandler) already knows that
 ticket's parentId and passes it directly, since a ticket's own displayed progress is always
 derived live from its own status when it has no children (see
 TicketResultAssembler.computeProgress) - only a ticket WITH children ever needs its rollup
 recomputed. */
final public class PropagateProgressCommand {

    @NotNull
    private final UUID ticketId;

    public PropagateProgressCommand(UUID ticketId) {
        this.ticketId = ticketId;
    }

    public UUID getTicketId() {
        return ticketId;
    }
}
