package vantaCore.application.documentation.platform.domain.repository;

import vantaCore.application.documentation.platform.domain.PlatformDocumentationAggregate;
import vantaCore.application.project.domain.vo.ProjectId;

import java.time.Instant;
import java.util.Optional;

public interface PlatformDocumentationRepositoryInterface {

    /** appends a new version, never overwrites a previous one */
    void save(PlatformDocumentationAggregate documentation);

    /** most recent version for the project ("current" state) */
    Optional<PlatformDocumentationAggregate> findLatestByProjectId(ProjectId projectId);

    /** the single most recent version strictly older than the given instant, for stepping back through history */
    Optional<PlatformDocumentationAggregate> findVersionBefore(ProjectId projectId, Instant before);
}
