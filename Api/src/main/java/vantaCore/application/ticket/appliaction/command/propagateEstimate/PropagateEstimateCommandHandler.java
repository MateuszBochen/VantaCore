package vantaCore.application.ticket.appliaction.command.propagateEstimate;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.util.UUID;

/** Applies an estimate delta to this ticket's own estimate_all and every ancestor's, up to the root
 (unlike time_spent, there's no separate "own value" increment here - estimate itself is a normal
 mapped field already updated by the regular ticket save, only the rollup needs propagating). */
@Component
final public class PropagateEstimateCommandHandler implements CommandHandlerInterface<PropagateEstimateCommand> {

    private final TicketAggregateRepositoryInterface repository;

    public PropagateEstimateCommandHandler(TicketAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Void handle(PropagateEstimateCommand command) {
        double deltaEstimate = command.getDeltaEstimate();

        if (deltaEstimate == 0.0) {
            return null;
        }

        UUID currentId = command.getTicketId();

        while (currentId != null) {
            TicketId current = new TicketId(currentId);
            this.repository.incrementEstimateAll(current, deltaEstimate);

            currentId = this.repository.findById(current)
                .map(ticket -> ticket.toSnapshot().parentId())
                .orElse(null);
        }

        return null;
    }
}
