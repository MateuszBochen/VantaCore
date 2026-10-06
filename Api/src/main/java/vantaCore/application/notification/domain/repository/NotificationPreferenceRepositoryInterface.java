package vantaCore.application.notification.domain.repository;

import vantaCore.application.notification.domain.NotificationPreferenceAggregate;
import vantaCore.application.notification.domain.vo.NotificationEventType;
import vantaCore.application.notification.domain.vo.NotificationPreferenceId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationPreferenceRepositoryInterface {

    void save(NotificationPreferenceAggregate preference);

    /** Every override this user has, across every project/event type - small enough (a handful of
     rows per user, at most) that NotificationPreferenceResolver fetches this once per notification
     and resolves precedence in memory rather than querying per-combination. */
    List<NotificationPreferenceAggregate> findAllByUserId(UUID userId);

    /** projectId/eventType are matched null-safely (null must match null, not "no result") - see
     JpaNotificationPreferenceRepositoryAdapter. Used by the upsert command handler to find the
     existing row (if any) for this exact key, so it reuses that row's id instead of creating a
     duplicate the unique index would then reject. */
    Optional<NotificationPreferenceAggregate> findByUserIdAndProjectIdAndEventType(
        UUID userId, UUID projectId, NotificationEventType eventType
    );
}
