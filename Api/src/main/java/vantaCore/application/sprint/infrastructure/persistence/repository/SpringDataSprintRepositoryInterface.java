package vantaCore.application.sprint.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vantaCore.application.sprint.infrastructure.persistence.entity.SprintEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SpringDataSprintRepositoryInterface extends JpaRepository<SprintEntity, UUID> {

    @Query("""
        SELECT s FROM SprintEntity s
        WHERE s.boardId = :boardId
        AND (:from IS NULL OR s.startDate >= :from)
        AND (:till IS NULL OR s.startDate <= :till)
        ORDER BY s.startDate DESC
        """)
    List<SprintEntity> findAllByBoardId(
        @Param("boardId") UUID boardId,
        @Param("from") LocalDate from,
        @Param("till") LocalDate till
    );

    @Query("""
        SELECT s FROM SprintEntity s
        WHERE s.boardId = :boardId
        AND s.status <> vantaCore.application.sprint.domain.vo.SprintStatus.CLOSED
        AND (:excludeId IS NULL OR s.id <> :excludeId)
        """)
    List<SprintEntity> findAllOpenByBoardIdExcludingId(
        @Param("boardId") UUID boardId,
        @Param("excludeId") UUID excludeId
    );

    @Query("""
        SELECT s FROM SprintEntity s
        JOIN s.ticketIds t
        WHERE t = :ticketId
        AND s.status = vantaCore.application.sprint.domain.vo.SprintStatus.ACTIVE
        """)
    List<SprintEntity> findAllActiveByTicketId(@Param("ticketId") UUID ticketId);

    @Query("""
        SELECT s FROM SprintEntity s
        JOIN s.ticketIds t
        WHERE t = :ticketId
        AND s.status <> vantaCore.application.sprint.domain.vo.SprintStatus.CLOSED
        """)
    List<SprintEntity> findAllOpenByTicketId(@Param("ticketId") UUID ticketId);

    @Query("SELECT s FROM SprintEntity s WHERE s.status = vantaCore.application.sprint.domain.vo.SprintStatus.ACTIVE")
    List<SprintEntity> findAllActive();
}
