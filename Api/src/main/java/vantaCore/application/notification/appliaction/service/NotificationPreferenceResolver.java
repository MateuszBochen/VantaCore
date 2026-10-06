package vantaCore.application.notification.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.notification.domain.NotificationPreferenceAggregate;
import vantaCore.application.notification.domain.repository.NotificationPreferenceRepositoryInterface;
import vantaCore.application.notification.domain.vo.NotificationEventType;
import vantaCore.application.notification.domain.vo.NotificationMode;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/** Resolves the effective NotificationMode for one about-to-be-created notification. Precedence
 (most specific wins) isn't spelled out in the sub-project's own data model doc - this is this
 implementation's own interpretation, most-specific-override-wins being the conventional behavior
 for this shape of per-scope override system (matches e.g. how GitHub/Slack notification settings
 layer project-level and global preferences): exact (project+eventType) > project-only (all event
 types in this project) > eventType-only (this event type everywhere) > global (everything) > no row
 at all -> REALTIME. */
@Component
public class NotificationPreferenceResolver {

    private final NotificationPreferenceRepositoryInterface repository;

    public NotificationPreferenceResolver(NotificationPreferenceRepositoryInterface repository) {
        this.repository = repository;
    }

    public NotificationMode resolve(UUID userId, UUID projectId, NotificationEventType eventType) {
        List<NotificationPreferenceAggregate> preferences = this.repository.findAllByUserId(userId);

        return findMode(preferences, projectId, eventType)
            .or(() -> findMode(preferences, projectId, null))
            .or(() -> findMode(preferences, null, eventType))
            .or(() -> findMode(preferences, null, null))
            .orElse(NotificationMode.REALTIME);
    }

    private Optional<NotificationMode> findMode(
        List<NotificationPreferenceAggregate> preferences, UUID projectId, NotificationEventType eventType
    ) {
        return preferences.stream()
            .filter(preference -> Objects.equals(preference.getProjectId(), projectId))
            .filter(preference -> preference.getEventType() == eventType)
            .map(NotificationPreferenceAggregate::getMode)
            .findFirst();
    }
}
