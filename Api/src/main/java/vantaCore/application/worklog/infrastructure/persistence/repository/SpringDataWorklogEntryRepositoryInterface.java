package vantaCore.application.worklog.infrastructure.persistence.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.worklog.infrastructure.persistence.entity.WorklogEntryEntity;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface SpringDataWorklogEntryRepositoryInterface extends JpaRepository<WorklogEntryEntity, UUID> {

    List<WorklogEntryEntity> findAllByTicketIdOrderByCreatedAtDesc(UUID ticketId);

    Page<WorklogEntryEntity> findAllByUserIdInAndDateBetweenOrderByDateDescCreatedAtDesc(
        Collection<UUID> userIds, LocalDateTime startDateTime, LocalDateTime endDateTime, Pageable pageable
    );
}
