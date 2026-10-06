package vantaCore.application.sprint.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.SprintSnapshot;
import vantaCore.application.sprint.domain.repository.SprintBurndownRepositoryInterface;
import vantaCore.application.sprint.domain.vo.EstimateUnitValue;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Records today's remaining-work point (per estimate unit) for a sprint - remaining = current
 total scope minus what's currently done. Callers are responsible for only invoking this for
 ACTIVE sprints (FUTURE has no scope to burn down yet, CLOSED is frozen history); see
 StartSprintCommandHandler, UpsertSprintCommandHandler, RecalculateActiveSprintEstimateCommandHandler
 and SprintBurndownScheduler for the trigger points. */
@Component
public class SprintBurndownRecorder {

    private final SprintEstimateCalculator estimateCalculator;
    private final SprintBurndownRepositoryInterface burndownRepository;

    public SprintBurndownRecorder(
        SprintEstimateCalculator estimateCalculator,
        SprintBurndownRepositoryInterface burndownRepository
    ) {
        this.estimateCalculator = estimateCalculator;
        this.burndownRepository = burndownRepository;
    }

    public void recordToday(SprintAggregate sprint) {
        SprintSnapshot snapshot = sprint.toSnapshot();
        LocalDate today = LocalDate.now();

        List<EstimateUnitValue> total = this.estimateCalculator.calculate(snapshot.ticketIds(), false);
        List<EstimateUnitValue> done = this.estimateCalculator.calculate(snapshot.ticketIds(), true);

        Map<String, Double> doneByUnit = done.stream()
            .collect(Collectors.toMap(EstimateUnitValue::unit, EstimateUnitValue::value));

        for (EstimateUnitValue totalForUnit : total) {
            double remaining = totalForUnit.value() - doneByUnit.getOrDefault(totalForUnit.unit(), 0.0);
            this.burndownRepository.upsertPoint(snapshot.id().value(), totalForUnit.unit(), today, remaining);
        }
    }
}
