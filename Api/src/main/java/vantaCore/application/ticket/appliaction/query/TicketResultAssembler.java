package vantaCore.application.ticket.appliaction.query;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.sprint.domain.vo.SprintStatus;
import vantaCore.application.ticket.appliaction.query.getTicket.GetTicketResult;
import vantaCore.application.ticket.appliaction.query.getTicket.TicketRelatedTicketResult;
import vantaCore.application.ticket.appliaction.query.getTicket.TicketSprintResult;
import vantaCore.application.ticket.appliaction.service.TicketRelationEnricher;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface.TicketRollup;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/** Shared by GetTicketQueryHandler and ListTicketsQueryHandler - assembling a full GetTicketResult
 (rollup lookup, progress computation) is the same work whether it's for one ticket or a page of them.
 Reads SprintAggregateRepositoryInterface directly (Sprint module) rather than via an event - same
 read-only-lookup carve-out UpsertTicketCommandHandler.checkAgainstActiveSprint already uses. */
@Component
public class TicketResultAssembler {

    private final TicketAggregateRepositoryInterface repository;
    private final SprintAggregateRepositoryInterface sprintRepository;
    private final TicketRelationEnricher relationEnricher;

    public TicketResultAssembler(
        TicketAggregateRepositoryInterface repository,
        SprintAggregateRepositoryInterface sprintRepository,
        TicketRelationEnricher relationEnricher
    ) {
        this.repository = repository;
        this.sprintRepository = sprintRepository;
        this.relationEnricher = relationEnricher;
    }

    public GetTicketResult toResult(TicketAggregate ticketAggregate, ProjectAggregate project) {
        TicketSnapshot ticket = ticketAggregate.toSnapshot();
        List<TicketAggregate> children = this.repository.findAllByParentId(ticket.id());
        TicketRollup rollup = this.repository.findRollup(ticket.id());
        TicketSprintResult sprint = pickDisplaySprint(this.sprintRepository.findAllOpenByTicketId(ticket.id().value()))
            .map(SprintAggregate::toSnapshot)
            .map(snapshot -> new TicketSprintResult(snapshot.id().value(), snapshot.name()))
            .orElse(null);
        List<TicketRelatedTicketResult> relatedTickets = this.relationEnricher.enrich(ticket.relatedTickets());

        return new GetTicketResult(
            ticket.id().value(),
            ticket.key().value(),
            ticket.authorId(),
            ticket.projectId(),
            ticket.subProjectId(),
            ticket.issueTypeId(),
            ticket.statusId(),
            ticket.parentId(),
            ticket.title(),
            ticket.description(),
            ticket.priority(),
            ticket.estimate(),
            ticket.assigneeIds(),
            ticket.flagIds(),
            ticket.tags(),
            ticket.customFields(),
            relatedTickets,
            ticket.createdAt(),
            ticket.changedAt(),
            rollup.timeSpent(),
            rollup.timeSpentAll(),
            rollup.estimateAll(),
            List.of(),
            children.size(),
            computeProgress(ticket, children, rollup, project),
            sprint
        );
    }

    // Nothing stops a ticket being planned into more than one open sprint at once (see
    // SprintAggregateRepositoryInterface.findAllOpenByTicketId's javadoc) - GetTicketResult only has
    // room to surface one, so this picks the most relevant: ACTIVE beats FUTURE, ties broken by
    // whichever sprint started (or will start) most recently.
    private Optional<SprintAggregate> pickDisplaySprint(List<SprintAggregate> openSprints) {
        return openSprints.stream().max(
            Comparator.<SprintAggregate>comparingInt(sprint -> sprint.toSnapshot().status() == SprintStatus.ACTIVE ? 1 : 0)
                .thenComparing(sprint -> sprint.toSnapshot().startDate(), Comparator.nullsFirst(Comparator.naturalOrder()))
        );
    }

    // A leaf ticket (no children) is 100% if it's done itself, otherwise progress isn't a
    // meaningful concept for it - null, not 0. A ticket WITH children reads its already-computed
    // recursive rollup (see PropagateProgressCommandHandler) rather than re-deriving anything here
    // - this method is deliberately cheap (no extra queries), the real work happens on write.
    private Integer computeProgress(TicketSnapshot ticket, List<TicketAggregate> children, TicketRollup rollup, ProjectAggregate project) {
        if (children.isEmpty()) {
            return project.isStatusDone(ticket.statusId()) ? 100 : null;
        }

        return rollup.progress();
    }
}
