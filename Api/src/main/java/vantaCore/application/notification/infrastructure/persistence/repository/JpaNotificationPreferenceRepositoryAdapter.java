package vantaCore.application.notification.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.notification.domain.NotificationPreferenceAggregate;
import vantaCore.application.notification.domain.repository.NotificationPreferenceRepositoryInterface;
import vantaCore.application.notification.domain.vo.NotificationEventType;
import vantaCore.application.notification.infrastructure.persistence.entity.NotificationPreferenceEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaNotificationPreferenceRepositoryAdapter implements NotificationPreferenceRepositoryInterface {

    private final SpringDataNotificationPreferenceRepositoryInterface repository;

    public JpaNotificationPreferenceRepositoryAdapter(SpringDataNotificationPreferenceRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(NotificationPreferenceAggregate preference) {
        this.repository.save(NotificationPreferenceEntity.fromDomain(preference));
    }

    @Override
    public List<NotificationPreferenceAggregate> findAllByUserId(UUID userId) {
        return this.repository.findAllByUserId(userId).stream()
            .map(NotificationPreferenceEntity::toDomain)
            .toList();
    }

    @Override
    public Optional<NotificationPreferenceAggregate> findByUserIdAndProjectIdAndEventType(
        UUID userId, UUID projectId, NotificationEventType eventType
    ) {
        return this.repository.findByUserIdAndProjectIdAndEventType(userId, projectId, eventType)
            .map(NotificationPreferenceEntity::toDomain);
    }
}
