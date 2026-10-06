package vantaCore.application.release.infrastructure.persistence.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vantaCore.application.release.infrastructure.persistence.entity.ReleaseEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SpringDataReleaseRepositoryInterface extends JpaRepository<ReleaseEntity, UUID> {

    List<ReleaseEntity> findAllByProjectIdOrderByPlannedReleaseDateDesc(UUID projectId);

    Page<ReleaseEntity> findAllByProjectId(UUID projectId, Pageable pageable);

    // Null-safe range filter (either bound may be omitted) - see
    // ReleaseAggregateRepositoryInterface.findPage's own javadoc. CAST(:from AS date), not the
    // bare parameter - Postgres can't infer a bind parameter's type from "? IS NULL" alone when
    // the actual value passed is null ("could not determine data type of parameter"), same
    // "explicit CAST over a bare bound parameter" issue as JpaProjectStatsRepositoryAdapter's
    // generate_series query.
    @Query(
        "SELECT r FROM ReleaseEntity r WHERE " +
        "(CAST(:from AS date) IS NULL OR r.plannedReleaseDate >= CAST(:from AS date)) " +
        "AND (CAST(:till AS date) IS NULL OR r.plannedReleaseDate <= CAST(:till AS date))"
    )
    Page<ReleaseEntity> findAllInRange(@Param("from") LocalDate from, @Param("till") LocalDate till, Pageable pageable);
}
