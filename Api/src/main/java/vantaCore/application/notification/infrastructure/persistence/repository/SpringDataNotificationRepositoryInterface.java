package vantaCore.application.notification.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import vantaCore.application.notification.infrastructure.persistence.entity.NotificationEntity;

import java.util.List;
import java.util.UUID;

public interface SpringDataNotificationRepositoryInterface extends JpaRepository<NotificationEntity, UUID> {

    List<NotificationEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT DISTINCT n.userId FROM NotificationEntity n WHERE n.pendingDigest = true")
    List<UUID> findDistinctUserIdsWithPendingDigest();

    List<NotificationEntity> findAllByUserIdAndPendingDigestTrueOrderByCreatedAtAsc(UUID userId);
}
