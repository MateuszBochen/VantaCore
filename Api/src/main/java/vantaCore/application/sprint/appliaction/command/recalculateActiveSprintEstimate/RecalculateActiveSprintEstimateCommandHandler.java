package vantaCore.application.sprint.appliaction.command.recalculateActiveSprintEstimate;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.sprint.appliaction.service.SprintBurndownRecorder;
import vantaCore.application.sprint.appliaction.service.SprintEstimateCalculator;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.sprint.domain.vo.EstimateUnitValue;
import vantaCore.application.sprint.domain.vo.SprintId;

import java.util.List;

@Component
final public class RecalculateActiveSprintEstimateCommandHandler
    implements CommandHandlerInterface<RecalculateActiveSprintEstimateCommand> {

    private final SprintAggregateRepositoryInterface repository;
    private final SprintEstimateCalculator estimateCalculator;
    private final SprintBurndownRecorder burndownRecorder;

    public RecalculateActiveSprintEstimateCommandHandler(
        SprintAggregateRepositoryInterface repository,
        SprintEstimateCalculator estimateCalculator,
        SprintBurndownRecorder burndownRecorder
    ) {
        this.repository = repository;
        this.estimateCalculator = estimateCalculator;
        this.burndownRecorder = burndownRecorder;
    }

    @Override
    public Void handle(RecalculateActiveSprintEstimateCommand command) {
        SprintId sprintId = new SprintId(command.getSprintId());

        // The sprint may have raced to CLOSED between the triggering event and this dispatch (both
        // synchronous within the same request, but from the ticket module's side) - harmless either
        // way, closeSprint's own final refresh is authoritative once that happens.
        this.repository.findById(sprintId).ifPresent(sprint -> {
            List<EstimateUnitValue> actualEstimateUnit =
                this.estimateCalculator.calculate(sprint.toSnapshot().ticketIds(), true);

            SprintAggregate updated = sprint.updateActualEstimateUnit(actualEstimateUnit);
            this.repository.save(updated);

            // Same "make today's transition visible immediately" reasoning as
            // UpsertSprintCommandHandler - a ticket being marked done should move the burndown
            // line right away, not just tonight.
            this.burndownRecorder.recordToday(updated);
        });

        return null;
    }
}
