package vantaCore.application.notification.domain.repository;

import vantaCore.application.notification.domain.NotificationAggregate;
import vantaCore.application.notification.domain.vo.NotificationId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationAggregateRepositoryInterface {

    void save(NotificationAggregate notification);

    Optional<NotificationAggregate> findById(NotificationId id);

    /** newest first */
    List<NotificationAggregate> findAllByUserId(UUID userId);

    /** Every user with at least one un-flushed DIGEST notification - NotificationDigestFlushJob
     iterates this to know who it owes a batched push to. */
    List<UUID> findDistinctUserIdsWithPendingDigest();

    /** This user's still-pending DIGEST notifications, oldest first (the order they'll appear in
     the batch push). */
    List<NotificationAggregate> findAllByUserIdAndPendingDigestTrue(UUID userId);
}
