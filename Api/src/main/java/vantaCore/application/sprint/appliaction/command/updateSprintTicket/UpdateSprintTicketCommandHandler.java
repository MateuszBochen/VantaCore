package vantaCore.application.sprint.appliaction.command.updateSprintTicket;

import org.springframework.stereotype.Component;
import vantaCore.application.board.domain.BoardAggregate;
import vantaCore.application.board.domain.repository.BoardAggregateRepositoryInterface;
import vantaCore.application.board.domain.vo.BoardId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.BoardNotFoundException;
import vantaCore.application.shared.application.exception.SprintNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.sprint.appliaction.dto.SprintTicketActionRequest;
import vantaCore.application.sprint.appliaction.dto.UpdateSprintTicketRequest;
import vantaCore.application.sprint.appliaction.service.SprintBurndownRecorder;
import vantaCore.application.sprint.appliaction.service.SprintEstimateCalculator;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.SprintSnapshot;
import vantaCore.application.sprint.domain.policy.UpsertSprintCheck;
import vantaCore.application.sprint.domain.policy.UpsertSprintPolicy;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.sprint.domain.vo.SprintId;
import vantaCore.application.sprint.domain.vo.SprintStatus;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

// Adds or removes a batch of tickets from a sprint, unlike UpsertSprintCommand which replaces the
// whole ticket set wholesale - convenient for a single drag-and-drop/checkbox action (one ticket) or
// a multi-select one (several) without the frontend having to round-trip the entire current list.
// Reuses UpsertSprintPolicy for validation (dates, closed-sprint immutability, active-sprint
// add/remove gating) so both write paths stay consistent.
@Component
final public class UpdateSprintTicketCommandHandler implements CommandHandlerInterface<UpdateSprintTicketCommand> {

    private final SprintAggregateRepositoryInterface repository;
    private final BoardAggregateRepositoryInterface boardRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final UpsertSprintPolicy upsertSprintPolicy;
    private final SprintEstimateCalculator estimateCalculator;
    private final SprintBurndownRecorder burndownRecorder;

    public UpdateSprintTicketCommandHandler(
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
    public Void handle(UpdateSprintTicketCommand command) {
        BoardId boardId = new BoardId(command.getBoardId());
        SprintId sprintId = new SprintId(command.getSprintId());

        BoardAggregate board = this.boardRepository.findById(boardId).orElseThrow(BoardNotFoundException::new);

        SprintAggregate existing = this.repository.findById(sprintId).orElseThrow(SprintNotFoundException::new);
        if (!existing.toSnapshot().boardId().equals(boardId.value())) {
            throw new SprintNotFoundException();
        }

        UpdateSprintTicketRequest request = command.getUpdateSprintTicketRequest();

        SprintSnapshot existingSnapshot = existing.toSnapshot();
        Set<UUID> ticketIds = new HashSet<>(existingSnapshot.ticketIds());

        // Applied in list order onto the same working set, so a duplicate ticketId with conflicting
        // actions in one request resolves to "whichever came last" rather than being rejected.
        for (SprintTicketActionRequest ticketAction : request.getTickets()) {
            TicketId ticketId = new TicketId(ticketAction.getTicketId());
            this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

            switch (ticketAction.getAction()) {
                case ADD -> ticketIds.add(ticketId.value());
                case REMOVE -> ticketIds.remove(ticketId.value());
            }
        }

        SprintAggregate sprint = existing.changeSprint(
            existingSnapshot.name(),
            existingSnapshot.startDate(),
            existingSnapshot.endDate(),
            ticketIds
        );

        this.upsertSprintPolicy.check(new UpsertSprintCheck(sprint, existing, board.toSnapshot())).assertAllowed();

        boolean isActive = existingSnapshot.status() == SprintStatus.ACTIVE;
        if (isActive) {
            sprint = sprint.updateActualEstimateUnit(this.estimateCalculator.calculate(ticketIds, true));
        }

        this.repository.save(sprint);

        if (isActive) {
            this.burndownRecorder.recordToday(sprint);
        }

        return null;
    }
}
