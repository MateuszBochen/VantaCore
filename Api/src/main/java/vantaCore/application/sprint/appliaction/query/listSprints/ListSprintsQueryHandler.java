package vantaCore.application.sprint.appliaction.query.listSprints;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.SprintSnapshot;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.sprint.domain.vo.EstimateUnitValue;
import vantaCore.application.sprint.domain.vo.SprintReportEntry;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
final public class ListSprintsQueryHandler implements QueryHandlerInterface<ListSprintsQuery, Collection<SprintResult>> {

    private final SprintAggregateRepositoryInterface repository;
    private final TicketAggregateRepositoryInterface ticketRepository;

    public ListSprintsQueryHandler(
        SprintAggregateRepositoryInterface repository,
        TicketAggregateRepositoryInterface ticketRepository
    ) {
        this.repository = repository;
        this.ticketRepository = ticketRepository;
    }

    @Override
    public Collection<SprintResult> handle(ListSprintsQuery query) {
        List<SprintSnapshot> sprints = this.repository.findAllByBoardId(query.getBoardId(), query.getFrom(), query.getTill()).stream()
            .map(SprintAggregate::toSnapshot)
            .toList();

        Set<UUID> allTicketIds = sprints.stream()
            .flatMap(sprint -> sprint.ticketIds().stream())
            .collect(Collectors.toSet());

        Map<UUID, UUID> projectIdsByTicketId = this.ticketRepository.findProjectIdsByIds(allTicketIds);

        List<Item<SprintResult>> items = sprints.stream()
            .map(sprint -> Item.fromPayload(sprint.id().toString(), toResult(sprint, projectIdsByTicketId)))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }

    private SprintResult toResult(SprintSnapshot sprint, Map<UUID, UUID> projectIdsByTicketId) {
        // A ticket id with no matching projectId (deleted ticket - there's no FK, see
        // V17__create_boards.sql's board_projects reasoning) is dropped rather than sent with a
        // null projectId, so the frontend never has to handle a half-populated ticket entry.
        List<SprintTicketResult> tickets = sprint.ticketIds().stream()
            .filter(projectIdsByTicketId::containsKey)
            .map(ticketId -> new SprintTicketResult(ticketId, projectIdsByTicketId.get(ticketId)))
            .toList();

        return new SprintResult(
            sprint.id().value(),
            sprint.boardId(),
            sprint.name(),
            sprint.startDate(),
            sprint.endDate(),
            sprint.status().name().toLowerCase(),
            tickets,
            sprint.startedAt(),
            sprint.startedByUserId(),
            sprint.closedAt(),
            sprint.closedByUserId(),
            sprint.report().stream().map(this::toReportEntryResult).toList(),
            toEstimateUnitResults(sprint.initialEstimateUnit()),
            toEstimateUnitResults(sprint.closingEstimateUnit()),
            toEstimateUnitResults(sprint.actualEstimateUnit())
        );
    }

    private SprintReportEntryResult toReportEntryResult(SprintReportEntry entry) {
        return new SprintReportEntryResult(entry.ticketId(), entry.statusId(), entry.timeSpent());
    }

    private List<EstimateUnitValueResult> toEstimateUnitResults(List<EstimateUnitValue> values) {
        return values.stream().map(value -> new EstimateUnitValueResult(value.unit(), value.value())).toList();
    }
}
