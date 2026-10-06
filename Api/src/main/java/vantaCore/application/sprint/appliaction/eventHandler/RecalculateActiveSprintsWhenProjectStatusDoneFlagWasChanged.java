package vantaCore.application.sprint.appliaction.eventHandler;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.event.ProjectStatusDoneFlagWasChanged;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.sprint.appliaction.command.recalculateActiveSprintEstimate.RecalculateActiveSprintEstimateCommand;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;

/** A status' isDone flag changed in project settings, so tickets in it became done/not-done without
 being edited - and no TicketWasChanged fires for that (see RecalculateActualEstimateWhenTicketWasChanged).
 Every ACTIVE sprint holding at least one such ticket gets its actualEstimateUnit + today's burndown
 point recomputed. CLOSED sprints are deliberately left alone - their estimates are frozen history,
 and findAllActive never returns them. Reads ticket ids straight from the ticket module's repository -
 a read-only cross-module lookup (see CLAUDE.md). */
@Component
public class RecalculateActiveSprintsWhenProjectStatusDoneFlagWasChanged implements EventHandlerInterface<ProjectStatusDoneFlagWasChanged> {

    private final SprintAggregateRepositoryInterface sprintRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final CommandBusInterface commandBus;

    // @Lazy for the same construction-time-cycle reason as PropagateTimeSpentWhenTicketTimeWasLogged.
    public RecalculateActiveSprintsWhenProjectStatusDoneFlagWasChanged(
        SprintAggregateRepositoryInterface sprintRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        @Lazy CommandBusInterface commandBus
    ) {
        this.sprintRepository = sprintRepository;
        this.ticketRepository = ticketRepository;
        this.commandBus = commandBus;
    }

    @Override
    public Void handle(ProjectStatusDoneFlagWasChanged event) {
        Set<UUID> affectedTicketIds = this.ticketRepository.findIdsByProjectIdAndStatusIds(event.projectId(), event.allChangedStatusIds());
        if (affectedTicketIds.isEmpty()) {
            return null;
        }

        for (SprintAggregate sprint : this.sprintRepository.findAllActive()) {
            if (!Collections.disjoint(sprint.toSnapshot().ticketIds(), affectedTicketIds)) {
                dispatch(new RecalculateActiveSprintEstimateCommand(sprint.toSnapshot().id().value()));
            }
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
