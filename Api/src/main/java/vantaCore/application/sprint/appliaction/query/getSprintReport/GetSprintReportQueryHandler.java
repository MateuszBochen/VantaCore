package vantaCore.application.sprint.appliaction.query.getSprintReport;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.exception.SprintNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.SprintSnapshot;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.sprint.domain.repository.SprintBurndownRepositoryInterface;
import vantaCore.application.sprint.domain.vo.SprintId;
import vantaCore.application.ticket.domain.history.TicketHistoryEntryAggregate;
import vantaCore.application.ticket.domain.history.TicketHistoryEntryAggregateRepositoryInterface;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
final public class GetSprintReportQueryHandler implements QueryHandlerInterface<GetSprintReportQuery, Item<SprintReportResult>> {

    private final SprintAggregateRepositoryInterface sprintRepository;
    private final TicketHistoryEntryAggregateRepositoryInterface historyRepository;
    private final SprintBurndownRepositoryInterface burndownRepository;

    public GetSprintReportQueryHandler(
        SprintAggregateRepositoryInterface sprintRepository,
        TicketHistoryEntryAggregateRepositoryInterface historyRepository,
        SprintBurndownRepositoryInterface burndownRepository
    ) {
        this.sprintRepository = sprintRepository;
        this.historyRepository = historyRepository;
        this.burndownRepository = burndownRepository;
    }

    @Override
    public Item<SprintReportResult> handle(GetSprintReportQuery query) {
        SprintId sprintId = new SprintId(query.getSprintId());

        SprintAggregate sprint = this.sprintRepository.findById(sprintId).orElseThrow(SprintNotFoundException::new);
        SprintSnapshot snapshot = sprint.toSnapshot();

        if (!snapshot.boardId().equals(query.getBoardId())) {
            throw new SprintNotFoundException();
        }

        // No window before the sprint has ever started (FUTURE) - nothing to count/chart yet.
        List<TicketStatusTransitionCountResult> transitions = snapshot.startedAt() == null
            ? List.of()
            : countTransitions(snapshot);

        List<BurndownByUnitResult> burndownByUnit = buildBurndownByUnit(snapshot.id().value());

        SprintReportResult result = new SprintReportResult(snapshot.id().value(), transitions, burndownByUnit);

        return Item.fromPayload(snapshot.id().toString(), result);
    }

    private List<BurndownByUnitResult> buildBurndownByUnit(UUID sprintId) {
        Map<String, List<SprintBurndownRepositoryInterface.BurndownPoint>> pointsByUnit = this.burndownRepository
            .findAllBySprintId(sprintId).stream()
            .collect(Collectors.groupingBy(SprintBurndownRepositoryInterface.BurndownPoint::unit));

        return pointsByUnit.entrySet().stream()
            .map(entry -> new BurndownByUnitResult(
                entry.getKey(),
                entry.getValue().stream()
                    .sorted(Comparator.comparing(SprintBurndownRepositoryInterface.BurndownPoint::date))
                    .map(point -> new BurndownPointResult(point.date(), point.remaining()))
                    .toList()
            ))
            .toList();
    }

    private List<TicketStatusTransitionCountResult> countTransitions(SprintSnapshot sprint) {
        Instant from = sprint.startedAt();
        Instant to = sprint.closedAt() != null ? sprint.closedAt() : Instant.now();

        Map<UUID, List<TicketHistoryEntryAggregate>> entriesByTicket = this.historyRepository
            .findAllByTicketIdInAndChangedAtBetween(sprint.ticketIds(), from, to).stream()
            .collect(Collectors.groupingBy(entry -> entry.toSnapshot().ticketId()));

        return sprint.ticketIds().stream()
            .map(ticketId -> new TicketStatusTransitionCountResult(
                ticketId,
                countStatusChanges(ticketId, entriesByTicket.getOrDefault(ticketId, List.of()), from)
            ))
            .toList();
    }

    // entriesInWindow is oldest-first (see the repository's OrderByChangedAtAsc). The entry
    // strictly before `from` supplies the baseline status to diff the first in-window entry
    // against - but if there IS no such entry (the ticket's very first history row falls inside
    // the window, i.e. it was created during the sprint), that first row is its initial status,
    // not a transition, so it's deliberately not counted.
    private int countStatusChanges(UUID ticketId, List<TicketHistoryEntryAggregate> entriesInWindow, Instant from) {
        UUID previousStatusId = this.historyRepository.findVersionBefore(ticketId, from)
            .map(entry -> entry.toSnapshot().ticket().statusId())
            .orElse(null);

        int count = 0;
        boolean hasBaseline = previousStatusId != null;

        for (TicketHistoryEntryAggregate entry : entriesInWindow) {
            UUID statusId = entry.toSnapshot().ticket().statusId();

            if (hasBaseline && !Objects.equals(previousStatusId, statusId)) {
                count++;
            }

            previousStatusId = statusId;
            hasBaseline = true;
        }

        return count;
    }
}
