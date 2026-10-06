package vantaCore.application.notification.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vantaCore.application.notification.domain.vo.NotificationEventType;
import vantaCore.application.notification.infrastructure.persistence.entity.NotificationPreferenceEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataNotificationPreferenceRepositoryInterface extends JpaRepository<NotificationPreferenceEntity, UUID> {

    List<NotificationPreferenceEntity> findAllByUserId(UUID userId);

    // Plain `p.projectId = :projectId` never matches when :projectId is bound to null (SQL/JPQL
    // "x = NULL" is never true) - the explicit "OR both sides are null" branch is what makes this
    // correctly treat null as "the wildcard row", not "no result".
    @Query("""
        SELECT p FROM NotificationPreferenceEntity p
        WHERE p.userId = :userId
          AND (p.projectId = :projectId OR (p.projectId IS NULL AND :projectId IS NULL))
          AND (p.eventType = :eventType OR (p.eventType IS NULL AND :eventType IS NULL))
        """)
    Optional<NotificationPreferenceEntity> findByUserIdAndProjectIdAndEventType(
        @Param("userId") UUID userId,
        @Param("projectId") UUID projectId,
        @Param("eventType") NotificationEventType eventType
    );
}
