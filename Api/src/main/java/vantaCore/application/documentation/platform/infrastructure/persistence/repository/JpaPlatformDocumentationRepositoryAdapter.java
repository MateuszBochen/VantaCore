package vantaCore.application.documentation.platform.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.documentation.platform.domain.PlatformDocumentationAggregate;
import vantaCore.application.documentation.platform.domain.repository.PlatformDocumentationRepositoryInterface;
import vantaCore.application.documentation.platform.infrastructure.persistence.entity.PlatformDocumentationEntity;
import vantaCore.application.project.domain.vo.ProjectId;

import java.time.Instant;
import java.util.Optional;

@Repository
public class JpaPlatformDocumentationRepositoryAdapter implements PlatformDocumentationRepositoryInterface {

    private final SpringDataPlatformDocumentationRepositoryInterface repository;

    public JpaPlatformDocumentationRepositoryAdapter(SpringDataPlatformDocumentationRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(PlatformDocumentationAggregate documentation) {
        PlatformDocumentationEntity entity = PlatformDocumentationEntity.fromDomain(documentation);
        this.repository.save(entity);
    }

    @Override
    public Optional<PlatformDocumentationAggregate> findLatestByProjectId(ProjectId projectId) {
        return this.repository.findFirstByProjectIdOrderByChangedAtDesc(projectId.value())
            .map(PlatformDocumentationEntity::toDomain);
    }

    @Override
    public Optional<PlatformDocumentationAggregate> findVersionBefore(ProjectId projectId, Instant before) {
        return this.repository.findFirstByProjectIdAndChangedAtBeforeOrderByChangedAtDesc(projectId.value(), before)
            .map(PlatformDocumentationEntity::toDomain);
    }
}
