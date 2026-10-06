package vantaCore.application.subProject.domain.repository;

import vantaCore.application.subProject.domain.SubProjectAggregate;
import vantaCore.application.subProject.domain.vo.SubProjectId;
import vantaCore.application.subProject.domain.vo.SubProjectName;
import vantaCore.application.subProject.domain.vo.SubProjectStatus;
import vantaCore.application.project.domain.vo.ProjectId;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SubProjectRepositoryInterface {

    /** appends a new version, never overwrites a previous one */
    void save(SubProjectAggregate subProject);

    /** most recent version for the sub-project ("current" state), scoped to its parent project */
    Optional<SubProjectAggregate> findLatestBySubProjectId(ProjectId projectId, SubProjectId subProjectId);

    /** the single most recent version strictly older than the given instant, for stepping back through history */
    Optional<SubProjectAggregate> findVersionBefore(ProjectId projectId, SubProjectId subProjectId, Instant before);

    /** lightweight id+name+status projection of every sub-project's latest version, for a project */
    List<SubProjectSummary> findAllLatestSummariesByProjectId(ProjectId projectId);

    record SubProjectSummary(SubProjectId id, SubProjectName name, SubProjectStatus status) {
    }
}
