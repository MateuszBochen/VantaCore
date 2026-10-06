package vantaCore.application.notification.appliaction.command.upsertNotificationPreference;

import org.springframework.stereotype.Component;
import vantaCore.application.notification.appliaction.dto.NotificationPreferenceRequest;
import vantaCore.application.notification.domain.NotificationPreferenceAggregate;
import vantaCore.application.notification.domain.repository.NotificationPreferenceRepositoryInterface;
import vantaCore.application.notification.domain.vo.NotificationPreferenceId;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;

import java.time.Instant;
import java.util.UUID;

@Component
final public class UpsertNotificationPreferenceCommandHandler implements CommandHandlerInterface<UpsertNotificationPreferenceCommand> {

    private final NotificationPreferenceRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final CurrentUserProviderInterface currentUserProvider;

    public UpsertNotificationPreferenceCommandHandler(
        NotificationPreferenceRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Void handle(UpsertNotificationPreferenceCommand command) {
        NotificationPreferenceRequest request = command.getNotificationPreferenceRequest();
        UUID userId = this.currentUserProvider.getCurrentUserId().value();

        if (request.getProjectId() != null) {
            this.projectRepository.findById(new ProjectId(request.getProjectId())).orElseThrow(ProjectNotFoundException::new);
        }

        // Reuses the existing row's id for this exact (user, project, eventType) key if one already
        // exists, rather than always inserting - these are overrides, one row per key, not an
        // append-only log (see NotificationPreferenceAggregate).
        NotificationPreferenceId id = this.repository
            .findByUserIdAndProjectIdAndEventType(userId, request.getProjectId(), request.getEventType())
            .map(NotificationPreferenceAggregate::getId)
            .orElseGet(() -> new NotificationPreferenceId(UUID.randomUUID()));

        NotificationPreferenceAggregate preference = NotificationPreferenceAggregate.of(
            id,
            userId,
            request.getProjectId(),
            request.getEventType(),
            request.getMode(),
            Instant.now()
        );

        this.repository.save(preference);

        return null;
    }
}
