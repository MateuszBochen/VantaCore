package vantaCore.application.sprint.infrastructure.scheduling;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vantaCore.application.sprint.appliaction.service.SprintBurndownRecorder;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;

/** Daily fallback so every ACTIVE sprint gets at least one burndown point per calendar day even
 with zero ticket activity - a "quiet" day would otherwise leave a gap, since
 SprintBurndownRecorder is otherwise only triggered reactively (see
 RecalculateActiveSprintEstimateCommandHandler / UpsertSprintCommandHandler / StartSprintCommandHandler). */
@Component
public class SprintBurndownScheduler {

    private final SprintAggregateRepositoryInterface sprintRepository;
    private final SprintBurndownRecorder burndownRecorder;

    public SprintBurndownScheduler(
        SprintAggregateRepositoryInterface sprintRepository,
        SprintBurndownRecorder burndownRecorder
    ) {
        this.sprintRepository = sprintRepository;
        this.burndownRecorder = burndownRecorder;
    }

    // 00:05 server time, every day.
    @Scheduled(cron = "0 5 0 * * *")
    public void recordDailyBurndownForActiveSprints() {
        this.sprintRepository.findAllActive().forEach(this.burndownRecorder::recordToday);
    }
}
