package vantaCore.application.ticket.infrastructure.persistence.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vantaCore.application.ticket.infrastructure.persistence.entity.TicketEntity;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataTicketRepositoryInterface extends JpaRepository<TicketEntity, UUID> {

    boolean existsByProjectId(UUID projectId);

    @Query("SELECT DISTINCT tag FROM TicketEntity t JOIN t.tags tag WHERE t.projectId = :projectId ORDER BY tag ASC")
    List<String> findAllDistinctTagsByProjectId(@Param("projectId") UUID projectId);

    List<TicketEntity> findAllByParentId(UUID parentId);

    List<TicketIdAndProjectIdProjection> findAllByIdIn(Collection<UUID> ids);

    Optional<TicketEntity> findByProjectIdAndKey(UUID projectId, String key);

    // Two separate methods rather than one with a nullable parentId param, for explicitness - null
    // means "root tickets only" (IS NULL), not "no filter", so there's no ambiguity to resolve anyway,
    // but this keeps the "which mode" branching in the adapter instead of relying on Spring Data's
    // implicit null-to-IS-NULL translation.
    Page<TicketEntity> findAllByProjectIdAndParentIdIsNull(UUID projectId, Pageable pageable);

    Page<TicketEntity> findAllByProjectIdAndParentId(UUID projectId, UUID parentId, Pageable pageable);
}
