package vantaCore.application.subProject.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vantaCore.application.subProject.infrastructure.persistence.entity.SubProjectEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataSubProjectRepositoryInterface extends JpaRepository<SubProjectEntity, UUID> {

    Optional<SubProjectEntity> findFirstBySubProjectIdAndProjectIdOrderByChangedAtDesc(UUID subProjectId, UUID projectId);

    Optional<SubProjectEntity> findFirstBySubProjectIdAndProjectIdAndChangedAtBeforeOrderByChangedAtDesc(
        UUID subProjectId,
        UUID projectId,
        Instant before
    );

    /** most recent row per distinct sub-project id, for a given project */
    @Query(
        value = "SELECT DISTINCT ON (sub_project_id) * FROM sub_project_versions "
            + "WHERE project_id = :projectId ORDER BY sub_project_id, changed_at DESC",
        nativeQuery = true
    )
    List<SubProjectEntity> findLatestVersionsByProjectId(@Param("projectId") UUID projectId);
}
