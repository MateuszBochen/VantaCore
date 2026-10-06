package vantaCore.application.sprint.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.SprintSnapshot;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.sprint.domain.vo.SprintStatus;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;

import java.util.Set;
import java.util.UUID;

@Component
final public class StartSprintPolicy implements PolicyInterface<SprintAggregate> {

    private final SprintAggregateRepositoryInterface repository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final ProjectAggregateRepositoryInterface projectRepository;

    public StartSprintPolicy(
        SprintAggregateRepositoryInterface repository,
        TicketAggregateRepositoryInterface ticketRepository,
        ProjectAggregateRepositoryInterface projectRepository
    ) {
        this.repository = repository;
        this.ticketRepository = ticketRepository;
        this.projectRepository = projectRepository;
    }

    @Override
    public NotificationCollection check(SprintAggregate value) {
        NotificationCollection notifications = new NotificationCollection();
        SprintSnapshot sprint = value.toSnapshot();

        if (sprint.status() != SprintStatus.FUTURE) {
            notifications.append(new Notification(
                "sprint-not-startable",
                "Only a future sprint can be started",
                true
            ));
        }

        boolean anotherActive = this.repository.findAllOpenByBoardIdExcludingId(sprint.boardId(), sprint.id()).stream()
            .anyMatch(other -> other.toSnapshot().status() == SprintStatus.ACTIVE);

        if (anotherActive) {
            notifications.append(new Notification(
                "board-already-has-active-sprint",
                "This board already has an active sprint",
                true
            ));
        }

        checkEstimateUnitsConfigured(sprint, notifications);

        return notifications;
    }

    // Without an estimate unit, a project's tickets can never contribute to initialEstimateUnit
    // (SprintEstimateCalculator silently skips projects with no configured unit), so starting would
    // produce a useless/empty burndown for that project's tickets - block it instead.
    private void checkEstimateUnitsConfigured(SprintSnapshot sprint, NotificationCollection notifications) {
        Set<UUID> projectIds = Set.copyOf(this.ticketRepository.findProjectIdsByIds(sprint.ticketIds()).values());

        boolean missingUnit = projectIds.stream().anyMatch(projectId -> {
            ProjectAggregate project = this.projectRepository.findById(new ProjectId(projectId)).orElse(null);
            return project == null || project.getEstimateUnit() == null || project.getEstimateUnit().isBlank();
        });

        if (missingUnit) {
            notifications.append(new Notification(
                "missing-estimate-unit",
                "Every project with tickets in this sprint must have an estimate unit configured before it can be started",
                true
            ));
        }
    }
}
