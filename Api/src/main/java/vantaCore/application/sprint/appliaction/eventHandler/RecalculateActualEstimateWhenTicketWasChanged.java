package vantaCore.application.sprint.appliaction.eventHandler;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.sprint.appliaction.command.recalculateActiveSprintEstimate.RecalculateActiveSprintEstimateCommand;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.event.TicketWasChanged;

/** Keeps a sprint's actualEstimateUnit (sum of done tickets' estimates) live - reacts to every
 change on a ticket that's currently in an ACTIVE sprint, not just status transitions, since the
 event carries no previous-state diff and a full recompute is cheap/always-correct regardless
 (see SprintEstimateCalculator). No-op for tickets not in an active sprint. */
@Component
public class RecalculateActualEstimateWhenTicketWasChanged implements EventHandlerInterface<TicketWasChanged> {

    private final SprintAggregateRepositoryInterface sprintRepository;
    private final CommandBusInterface commandBus;

    // @Lazy for the same construction-time-cycle reason as PropagateTimeSpentWhenTicketTimeWasLogged.
    public RecalculateActualEstimateWhenTicketWasChanged(
        SprintAggregateRepositoryInterface sprintRepository,
        @Lazy CommandBusInterface commandBus
    ) {
        this.sprintRepository = sprintRepository;
        this.commandBus = commandBus;
    }

    @Override
    public Void handle(TicketWasChanged event) {
        // A ticket can be planned into more than one active sprint at once (different boards) - see
        // SprintAggregateRepositoryInterface.findAllActiveByTicketId's javadoc - so every one of
        // them needs its actualEstimateUnit recomputed, not just the first.
        for (var sprint : this.sprintRepository.findAllActiveByTicketId(event.ticket().id().value())) {
            dispatch(new RecalculateActiveSprintEstimateCommand(sprint.toSnapshot().id().value()));
        }

        return null;
    }

    private void dispatch(RecalculateActiveSprintEstimateCommand command) {
        try {
            this.commandBus.handle(command);
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to recalculate active sprint estimate", exception);
        }
    }
}
