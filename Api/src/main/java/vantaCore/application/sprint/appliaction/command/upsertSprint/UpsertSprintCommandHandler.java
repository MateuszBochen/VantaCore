package vantaCore.application.sprint.appliaction.command.upsertSprint;

import org.springframework.stereotype.Component;
import vantaCore.application.board.domain.BoardAggregate;
import vantaCore.application.board.domain.repository.BoardAggregateRepositoryInterface;
import vantaCore.application.board.domain.vo.BoardId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.BoardNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.sprint.appliaction.dto.SprintTicketRequest;
import vantaCore.application.sprint.appliaction.dto.UpsertSprintRequest;
import vantaCore.application.sprint.appliaction.service.SprintBurndownRecorder;
import vantaCore.application.sprint.appliaction.service.SprintEstimateCalculator;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.policy.UpsertSprintCheck;
import vantaCore.application.sprint.domain.policy.UpsertSprintPolicy;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.sprint.domain.vo.SprintId;
import vantaCore.application.sprint.domain.vo.SprintStatus;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
final public class UpsertSprintCommandHandler implements CommandHandlerInterface<UpsertSprintCommand> {

    private final SprintAggregateRepositoryInterface repository;
    private final BoardAggregateRepositoryInterface boardRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final UpsertSprintPolicy upsertSprintPolicy;
    private final SprintEstimateCalculator estimateCalculator;
    private final SprintBurndownRecorder burndownRecorder;

    public UpsertSprintCommandHandler(
        SprintAggregateRepositoryInterface repository,
        BoardAggregateRepositoryInterface boardRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        UpsertSprintPolicy upsertSprintPolicy,
        SprintEstimateCalculator estimateCalculator,
        SprintBurndownRecorder burndownRecorder
    ) {
        this.repository = repository;
        this.boardRepository = boardRepository;
        this.ticketRepository = ticketRepository;
        this.upsertSprintPolicy = upsertSprintPolicy;
        this.estimateCalculator = estimateCalculator;
        this.burndownRecorder = burndownRecorder;
    }

    @Override
    public Void handle(UpsertSprintCommand command) {
        BoardId boardId = new BoardId(command.getBoardId());
        SprintId sprintId = new SprintId(command.getSprintId());

        BoardAggregate board = this.boardRepository.findById(boardId).orElseThrow(BoardNotFoundException::new);

        UpsertSprintRequest request = command.getUpsertSprintRequest();
        Set<UUID> ticketIds = toTicketIdSet(request.getTickets());

        for (UUID ticketId : ticketIds) {
            this.ticketRepository.findById(new TicketId(ticketId)).orElseThrow(TicketNotFoundException::new);
        }

        Optional<SprintAggregate> existing = this.repository.findById(sprintId);

        SprintAggregate sprint = existing
            .map(current -> current.changeSprint(
                request.getName(),
                request.getStartDate(),
                request.getEndDate(),
                ticketIds
            ))
            .orElseGet(() -> SprintAggregate.newSprint(
                sprintId,
                boardId.value(),
                request.getName(),
                request.getStartDate(),
                request.getEndDate(),
                SprintStatus.FUTURE,
                ticketIds,
                null,
                null,
                null,
                null,
                List.of(),
                List.of(),
                List.of(),
                List.of()
            ));

        this.upsertSprintPolicy.check(new UpsertSprintCheck(sprint, existing.orElse(null), board.toSnapshot())).assertAllowed();

        // The ticket set only affects actualEstimateUnit while the sprint is ACTIVE - a FUTURE
        // sprint's actual is always empty (nothing can be "done" before it starts), and a CLOSED one
        // is immutable (UpsertSprintPolicy already blocks editing it).
        boolean isActive = existing.isPresent() && existing.get().toSnapshot().status() == SprintStatus.ACTIVE;
        if (isActive) {
            sprint = sprint.updateActualEstimateUnit(this.estimateCalculator.calculate(ticketIds, true));
        }

        this.repository.save(sprint);

        if (isActive) {
            this.burndownRecorder.recordToday(sprint);
        }

        return null;
    }

    private Set<UUID> toTicketIdSet(List<SprintTicketRequest> tickets) {
        return tickets == null
            ? Set.of()
            : tickets.stream().map(SprintTicketRequest::getTicketId).collect(Collectors.toSet());
    }
}
