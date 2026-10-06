package vantaCore.application.sprint.appliaction.command.closeSprint;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.SprintNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.sprint.appliaction.service.SprintEstimateCalculator;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.policy.CloseSprintPolicy;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.sprint.domain.vo.EstimateUnitValue;
import vantaCore.application.sprint.domain.vo.SprintId;
import vantaCore.application.sprint.domain.vo.SprintReportEntry;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Component
final public class CloseSprintCommandHandler implements CommandHandlerInterface<CloseSprintCommand> {

    private final SprintAggregateRepositoryInterface repository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final CloseSprintPolicy closeSprintPolicy;
    private final CurrentUserProviderInterface currentUserProvider;
    private final SprintEstimateCalculator estimateCalculator;

    public CloseSprintCommandHandler(
        SprintAggregateRepositoryInterface repository,
        TicketAggregateRepositoryInterface ticketRepository,
        CloseSprintPolicy closeSprintPolicy,
        CurrentUserProviderInterface currentUserProvider,
        SprintEstimateCalculator estimateCalculator
    ) {
        this.repository = repository;
        this.ticketRepository = ticketRepository;
        this.closeSprintPolicy = closeSprintPolicy;
        this.currentUserProvider = currentUserProvider;
        this.estimateCalculator = estimateCalculator;
    }

    @Override
    public Void handle(CloseSprintCommand command) {
        SprintId sprintId = new SprintId(command.getSprintId());

        SprintAggregate sprint = this.repository.findById(sprintId).orElseThrow(SprintNotFoundException::new);

        if (!sprint.toSnapshot().boardId().equals(command.getBoardId())) {
            throw new SprintNotFoundException();
        }

        this.closeSprintPolicy.check(sprint).assertAllowed();

        List<SprintReportEntry> report = buildReport(sprint);

        // closingEstimateUnit = whatever's still in the sprint's scope at close (may differ from
        // initial if tickets were added/removed mid-sprint); actualEstimateUnit gets one final
        // refresh here in case the last ticket was marked done in the same action as closing.
        Set<UUID> ticketIds = sprint.toSnapshot().ticketIds();
        List<EstimateUnitValue> closingEstimateUnit = this.estimateCalculator.calculate(ticketIds, false);
        List<EstimateUnitValue> actualEstimateUnit = this.estimateCalculator.calculate(ticketIds, true);

        UserId currentUserId = this.currentUserProvider.getCurrentUserId();
        SprintAggregate closed = sprint.closeSprint(
            Instant.now(), currentUserId.value(), report, closingEstimateUnit, actualEstimateUnit
        );

        this.repository.save(closed);

        return null;
    }

    // Tickets aren't deletable in this app today, so every ticketId should resolve - but the sprint
    // report is a best-effort historical snapshot, not a live join, so a since-vanished ticket is
    // skipped rather than failing the whole close.
    private List<SprintReportEntry> buildReport(SprintAggregate sprint) {
        return sprint.toSnapshot().ticketIds().stream()
            .map(this::toReportEntry)
            .filter(Objects::nonNull)
            .toList();
    }

    private SprintReportEntry toReportEntry(UUID ticketId) {
        TicketId id = new TicketId(ticketId);

        return this.ticketRepository.findById(id)
            .map(TicketAggregate::toSnapshot)
            .map(ticket -> new SprintReportEntry(
                ticketId,
                ticket.statusId(),
                this.ticketRepository.findRollup(id).timeSpent()
            ))
            .orElse(null);
    }
}
