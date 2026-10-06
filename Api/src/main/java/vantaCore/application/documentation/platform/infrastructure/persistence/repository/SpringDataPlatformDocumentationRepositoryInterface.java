package vantaCore.application.documentation.platform.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.documentation.platform.infrastructure.persistence.entity.PlatformDocumentationEntity;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataPlatformDocumentationRepositoryInterface extends JpaRepository<PlatformDocumentationEntity, UUID> {

    Optional<PlatformDocumentationEntity> findFirstByProjectIdOrderByChangedAtDesc(UUID projectId);

    Optional<PlatformDocumentationEntity> findFirstByProjectIdAndChangedAtBeforeOrderByChangedAtDesc(UUID projectId, Instant before);
}
