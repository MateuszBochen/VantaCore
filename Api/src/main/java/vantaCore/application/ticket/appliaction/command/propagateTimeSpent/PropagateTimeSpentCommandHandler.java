package vantaCore.application.ticket.appliaction.command.propagateTimeSpent;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.util.UUID;

/** Applies a worklog time delta to a ticket's own time_spent, and to time_spent_all on that ticket
 and every ancestor up to the root. */
@Component
final public class PropagateTimeSpentCommandHandler implements CommandHandlerInterface<PropagateTimeSpentCommand> {

    private final TicketAggregateRepositoryInterface repository;

    public PropagateTimeSpentCommandHandler(TicketAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Void handle(PropagateTimeSpentCommand command) {
        int deltaMinutes = command.getDeltaMinutes();

        if (deltaMinutes == 0) {
            return null;
        }

        TicketId ticketId = new TicketId(command.getTicketId());
        this.repository.incrementTimeSpent(ticketId, deltaMinutes);

        UUID currentId = command.getTicketId();

        while (currentId != null) {
            TicketId current = new TicketId(currentId);
            this.repository.incrementTimeSpentAll(current, deltaMinutes);

            currentId = this.repository.findById(current)
                .map(ticket -> ticket.toSnapshot().parentId())
                .orElse(null);
        }

        return null;
    }
}
