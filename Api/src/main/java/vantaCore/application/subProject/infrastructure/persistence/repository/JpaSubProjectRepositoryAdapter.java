package vantaCore.application.subProject.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.subProject.domain.SubProjectAggregate;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface;
import vantaCore.application.subProject.domain.vo.SubProjectId;
import vantaCore.application.subProject.infrastructure.persistence.entity.SubProjectEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public class JpaSubProjectRepositoryAdapter implements SubProjectRepositoryInterface {

    private final SpringDataSubProjectRepositoryInterface repository;

    public JpaSubProjectRepositoryAdapter(SpringDataSubProjectRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(SubProjectAggregate subProject) {
        SubProjectEntity entity = SubProjectEntity.fromDomain(subProject);
        this.repository.save(entity);
    }

    @Override
    public Optional<SubProjectAggregate> findLatestBySubProjectId(ProjectId projectId, SubProjectId subProjectId) {
        return this.repository.findFirstBySubProjectIdAndProjectIdOrderByChangedAtDesc(subProjectId.value(), projectId.value())
            .map(SubProjectEntity::toDomain);
    }

    @Override
    public Optional<SubProjectAggregate> findVersionBefore(ProjectId projectId, SubProjectId subProjectId, Instant before) {
        return this.repository.findFirstBySubProjectIdAndProjectIdAndChangedAtBeforeOrderByChangedAtDesc(
                subProjectId.value(),
                projectId.value(),
                before
            )
            .map(SubProjectEntity::toDomain);
    }

    @Override
    public List<SubProjectSummary> findAllLatestSummariesByProjectId(ProjectId projectId) {
        return this.repository.findLatestVersionsByProjectId(projectId.value()).stream()
            .map(SubProjectEntity::toDomain)
            .map(subProject -> new SubProjectSummary(
                subProject.getSubProjectId(),
                subProject.getName(),
                subProject.getStatus()
            ))
            .toList();
    }
}
