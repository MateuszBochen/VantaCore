package vantaCore.application.sprint.appliaction.command.startSprint;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.SprintNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.sprint.appliaction.service.SprintBurndownRecorder;
import vantaCore.application.sprint.appliaction.service.SprintEstimateCalculator;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.policy.StartSprintPolicy;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.sprint.domain.vo.EstimateUnitValue;
import vantaCore.application.sprint.domain.vo.SprintId;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
final public class StartSprintCommandHandler implements CommandHandlerInterface<StartSprintCommand> {

    private final SprintAggregateRepositoryInterface repository;
    private final StartSprintPolicy startSprintPolicy;
    private final CurrentUserProviderInterface currentUserProvider;
    private final SprintEstimateCalculator estimateCalculator;
    private final SprintBurndownRecorder burndownRecorder;

    public StartSprintCommandHandler(
        SprintAggregateRepositoryInterface repository,
        StartSprintPolicy startSprintPolicy,
        CurrentUserProviderInterface currentUserProvider,
        SprintEstimateCalculator estimateCalculator,
        SprintBurndownRecorder burndownRecorder
    ) {
        this.repository = repository;
        this.startSprintPolicy = startSprintPolicy;
        this.currentUserProvider = currentUserProvider;
        this.estimateCalculator = estimateCalculator;
        this.burndownRecorder = burndownRecorder;
    }

    @Override
    public Void handle(StartSprintCommand command) {
        SprintId sprintId = new SprintId(command.getSprintId());

        SprintAggregate sprint = this.repository.findById(sprintId).orElseThrow(SprintNotFoundException::new);

        if (!sprint.toSnapshot().boardId().equals(command.getBoardId())) {
            throw new SprintNotFoundException();
        }

        this.startSprintPolicy.check(sprint).assertAllowed();

        UserId currentUserId = this.currentUserProvider.getCurrentUserId();

        // initialEstimateUnit = the sprint's whole starting scope; actualEstimateUnit is seeded
        // from whatever's already done at start time rather than left empty until the next
        // ticket-done event.
        Set<UUID> ticketIds = sprint.toSnapshot().ticketIds();
        List<EstimateUnitValue> initialEstimateUnit = this.estimateCalculator.calculate(ticketIds, false);
        List<EstimateUnitValue> actualEstimateUnit = this.estimateCalculator.calculate(ticketIds, true);

        SprintAggregate started = sprint.startSprint(
            Instant.now(), currentUserId.value(), initialEstimateUnit, actualEstimateUnit
        );

        this.repository.save(started);

        // Day-1 burndown point immediately, rather than waiting for tonight's cron - matters for a
        // sprint that starts and closes within the same day.
        this.burndownRecorder.recordToday(started);

        return null;
    }
}
