package vantaCore.application.ticket.appliaction.command.deleteTicket;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import vantaCore.application.board.domain.BoardAggregate;
import vantaCore.application.board.domain.repository.BoardAggregateRepositoryInterface;
import vantaCore.application.board.domain.vo.BoardId;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.event.EventBusInterface;
import vantaCore.application.shared.application.exception.BoardNotFoundException;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.sprint.appliaction.service.SprintBurndownRecorder;
import vantaCore.application.sprint.appliaction.service.SprintEstimateCalculator;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.SprintSnapshot;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.sprint.domain.vo.SprintStatus;
import vantaCore.application.ticket.appliaction.command.propagateEstimate.PropagateEstimateCommand;
import vantaCore.application.ticket.appliaction.command.propagateProgress.PropagateProgressCommand;
import vantaCore.application.ticket.appliaction.command.propagateTimeSpent.PropagateTimeSpentCommand;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.event.TicketWasDeleted;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface.TicketRollup;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.ticket.domain.vo.TicketRelation;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
final public class DeleteTicketCommandHandler implements CommandHandlerInterface<DeleteTicketCommand> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface repository;
    private final SprintAggregateRepositoryInterface sprintRepository;
    private final BoardAggregateRepositoryInterface boardRepository;
    private final SprintEstimateCalculator sprintEstimateCalculator;
    private final SprintBurndownRecorder sprintBurndownRecorder;
    private final EventBusInterface eventBus;
    private final CommandBusInterface commandBus;

    // @Lazy: same construction-time-cycle reason as UpsertTicketCommandHandler's own CommandBus -
    // this handler is itself a CommandHandlerInterface bean CommandBus's constructor collects.
    public DeleteTicketCommandHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface repository,
        SprintAggregateRepositoryInterface sprintRepository,
        BoardAggregateRepositoryInterface boardRepository,
        SprintEstimateCalculator sprintEstimateCalculator,
        SprintBurndownRecorder sprintBurndownRecorder,
        EventBusInterface eventBus,
        @Lazy CommandBusInterface commandBus
    ) {
        this.projectRepository = projectRepository;
        this.repository = repository;
        this.sprintRepository = sprintRepository;
        this.boardRepository = boardRepository;
        this.sprintEstimateCalculator = sprintEstimateCalculator;
        this.sprintBurndownRecorder = sprintBurndownRecorder;
        this.eventBus = eventBus;
        this.commandBus = commandBus;
    }

    @Override
    public Void handle(DeleteTicketCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        TicketId ticketId = new TicketId(command.getTicketId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        TicketAggregate ticket = this.repository.findById(ticketId).orElseThrow(TicketNotFoundException::new);
        TicketSnapshot snapshot = ticket.toSnapshot();

        // Don't distinguish "doesn't exist" from "belongs to a different project" - same
        // private-ish sub-resource reasoning as DeleteWorklogCommandHandler.
        if (!snapshot.projectId().equals(projectId.value())) {
            throw new TicketNotFoundException();
        }

        // The whole subtree goes, not just this ticket. Every ticket in it is checked BEFORE anything
        // is deleted - handlers don't run in a transaction (TransactionMiddleware isn't registered),
        // so failing halfway would leave a half-deleted tree behind.
        List<TicketAggregate> subtree = collectSubtree(ticket);
        for (TicketAggregate member : subtree) {
            checkAgainstActiveSprint(member.toSnapshot().id());
        }

        // subtree is parent-before-children (breadth-first), so walking it backwards deletes every
        // ticket only after all of its descendants are gone - each delete below is then always a
        // LEAF delete, exactly the case the single-ticket logic in deleteLeaf was written for.
        for (int i = subtree.size() - 1; i >= 0; i--) {
            deleteLeaf(subtree.get(i).toSnapshot());
        }

        return null;
    }

    /** The ticket plus all its descendants, breadth-first (a parent always before its children).
     The visited set only guards against a corrupted parentId cycle looping forever. */
    private List<TicketAggregate> collectSubtree(TicketAggregate root) {
        List<TicketAggregate> subtree = new ArrayList<>();
        Set<UUID> visited = new HashSet<>();
        Deque<TicketAggregate> queue = new ArrayDeque<>();
        queue.add(root);

        while (!queue.isEmpty()) {
            TicketAggregate current = queue.poll();
            TicketId currentId = current.toSnapshot().id();
            if (!visited.add(currentId.value())) {
                continue;
            }

            subtree.add(current);
            queue.addAll(this.repository.findAllByParentId(currentId));
        }

        return subtree;
    }

    /** Deletes one ticket that has no children (any it had were deleted just before it) - the
     original single-ticket delete: rollups, relations, sprint references, event. */
    private void deleteLeaf(TicketSnapshot snapshot) {
        TicketId ticketId = snapshot.id();

        cleanUpRelatedTicketReferences(ticketId.value());

        // Ancestors' timeSpentAll/estimateAll rollups must no longer count this ticket's own
        // contribution - dispatched BEFORE the delete, while the row (and its parentId chain) still
        // exists for these to walk up from. Its descendants were already deleted (each subtracting
        // its own share), so this ticket's own timeSpent/estimate is all that's left to subtract.
        TicketRollup rollup = this.repository.findRollup(ticketId);
        dispatch(new PropagateEstimateCommand(ticketId.value(), -snapshot.estimate()));
        dispatch(new PropagateTimeSpentCommand(ticketId.value(), -rollup.timeSpent()));

        this.repository.deleteById(ticketId);

        // Must run AFTER the delete, not before like the estimate/timeSpent propagation above -
        // recomputing the parent's progress needs findAllByParentId to already NOT see this ticket
        // (it's a leaf by now, so it's the parent's whole denominator that shrinks by one, not a
        // subtree to also account for).
        if (snapshot.parentId() != null) {
            dispatch(new PropagateProgressCommand(snapshot.parentId()));
        }

        // A CLOSED sprint's ticketIds/report are frozen history (see findAllOpenByTicketId's own
        // javadoc) and deliberately left untouched even if one of its tickets gets deleted
        // afterward - only an ACTIVE or FUTURE sprint still currently planning this ticket needs
        // its reference dropped so it doesn't dangle (rail/board resolution, velocity, burndown).
        cleanUpSprintReference(ticketId.value());

        this.eventBus.dispatch(new TicketWasDeleted(snapshot.id().value(), snapshot.projectId(), snapshot.key().value()));
    }

    // A ticket can be planned into more than one open sprint at once (different boards) - see
    // SprintAggregateRepositoryInterface.findAllOpenByTicketId's javadoc - so every one of them
    // needs its reference dropped, not just the first, or the deleted ticket would keep dangling in
    // whichever sprint this only checked one of.
    private void cleanUpSprintReference(UUID ticketId) {
        for (SprintAggregate existing : this.sprintRepository.findAllOpenByTicketId(ticketId)) {
            SprintSnapshot snapshot = existing.toSnapshot();

            Set<UUID> ticketIds = new HashSet<>(snapshot.ticketIds());
            ticketIds.remove(ticketId);

            SprintAggregate sprint = existing.changeSprint(snapshot.name(), snapshot.startDate(), snapshot.endDate(), ticketIds);

            // Same "ticket set only affects actualEstimateUnit while ACTIVE" reasoning as
            // UpsertSprintCommandHandler - a FUTURE sprint's actual is always empty regardless.
            boolean isActive = snapshot.status() == SprintStatus.ACTIVE;

            if (isActive) {
                sprint = sprint.updateActualEstimateUnit(this.sprintEstimateCalculator.calculate(ticketIds, true));
            }

            this.sprintRepository.save(sprint);

            if (isActive) {
                this.sprintBurndownRecorder.recordToday(sprint);
            }
        }
    }

    // Same gate a single-ticket edit already enforces (see TicketAgainstActiveSprintPolicy) -
    // deletion is the most extreme edit there is, so a board that won't allow editing a ticket
    // locked in an active sprint certainly shouldn't allow deleting it either.
    private void checkAgainstActiveSprint(TicketId ticketId) {
        for (SprintAggregate sprint : this.sprintRepository.findAllActiveByTicketId(ticketId.value())) {
            BoardAggregate board = this.boardRepository.findById(new BoardId(sprint.toSnapshot().boardId()))
                .orElseThrow(BoardNotFoundException::new);

            if (!board.toSnapshot().allowEditTicketInActiveSprint()) {
                throw new UnprocessableEntityException(List.of(new Notification(
                    "ticket-locked-in-active-sprint",
                    "This board does not allow editing tickets in an active sprint",
                    true
                )));
            }
        }
    }

    // The jsonb-stored relatedTickets on OTHER tickets pointing at this one would otherwise
    // silently dangle - findAllRelatingTo's javadoc/UpsertTicketCommandHandler.syncInverseRelations'
    // javadoc both flag this as the one case tickets-are-now-deletable makes newly reachable.
    private void cleanUpRelatedTicketReferences(UUID ticketId) {
        for (TicketAggregate other : this.repository.findAllRelatingTo(ticketId)) {
            TicketSnapshot otherSnapshot = other.toSnapshot();

            Set<TicketRelation> filtered = otherSnapshot.relatedTickets().stream()
                .filter(relation -> !relation.relatedTicketId().equals(ticketId))
                .collect(Collectors.toSet());

            if (filtered.size() != otherSnapshot.relatedTickets().size()) {
                this.repository.save(other.withRelatedTickets(filtered));
            }
        }
    }

    private void dispatch(PropagateEstimateCommand command) {
        try {
            this.commandBus.handle(command);
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to propagate ticket estimate", exception);
        }
    }

    private void dispatch(PropagateTimeSpentCommand command) {
        try {
            this.commandBus.handle(command);
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to propagate ticket time spent", exception);
        }
    }

    private void dispatch(PropagateProgressCommand command) {
        try {
            this.commandBus.handle(command);
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to propagate ticket progress", exception);
        }
    }
}
