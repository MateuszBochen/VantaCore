package vantaCore.application.vcs.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.vcs.infrastructure.persistence.entity.VcsConnectionEntity;

import java.util.List;
import java.util.UUID;

public interface SpringDataVcsConnectionRepositoryInterface extends JpaRepository<VcsConnectionEntity, UUID> {

    List<VcsConnectionEntity> findAllByProjectId(UUID projectId);
}
