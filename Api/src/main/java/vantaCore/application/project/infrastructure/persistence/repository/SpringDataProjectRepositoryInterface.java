package vantaCore.application.project.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.project.infrastructure.persistence.entity.ProjectEntity;

import java.util.List;
import java.util.UUID;

public interface SpringDataProjectRepositoryInterface extends JpaRepository<ProjectEntity, UUID> {

    List<ProjectIdAndNameProjection> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    boolean existsByPrefixIgnoreCaseAndIdNot(String prefix, UUID id);
}
