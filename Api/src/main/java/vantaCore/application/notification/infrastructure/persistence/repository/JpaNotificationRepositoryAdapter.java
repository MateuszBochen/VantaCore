package vantaCore.application.notification.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.notification.domain.NotificationAggregate;
import vantaCore.application.notification.domain.repository.NotificationAggregateRepositoryInterface;
import vantaCore.application.notification.domain.vo.NotificationId;
import vantaCore.application.notification.infrastructure.persistence.entity.NotificationEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaNotificationRepositoryAdapter implements NotificationAggregateRepositoryInterface {

    private final SpringDataNotificationRepositoryInterface repository;

    public JpaNotificationRepositoryAdapter(SpringDataNotificationRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(NotificationAggregate notification) {
        this.repository.save(NotificationEntity.fromDomain(notification));
    }

    @Override
    public Optional<NotificationAggregate> findById(NotificationId id) {
        return this.repository.findById(id.value()).map(NotificationEntity::toDomain);
    }

    @Override
    public List<NotificationAggregate> findAllByUserId(UUID userId) {
        return this.repository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(NotificationEntity::toDomain)
            .toList();
    }

    @Override
    public List<UUID> findDistinctUserIdsWithPendingDigest() {
        return this.repository.findDistinctUserIdsWithPendingDigest();
    }

    @Override
    public List<NotificationAggregate> findAllByUserIdAndPendingDigestTrue(UUID userId) {
        return this.repository.findAllByUserIdAndPendingDigestTrueOrderByCreatedAtAsc(userId).stream()
            .map(NotificationEntity::toDomain)
            .toList();
    }
}
