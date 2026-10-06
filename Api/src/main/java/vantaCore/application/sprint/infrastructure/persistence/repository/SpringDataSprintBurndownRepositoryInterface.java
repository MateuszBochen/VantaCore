package vantaCore.application.sprint.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.sprint.infrastructure.persistence.entity.SprintBurndownPointEntity;

import java.util.List;
import java.util.UUID;

public interface SpringDataSprintBurndownRepositoryInterface extends JpaRepository<SprintBurndownPointEntity, UUID> {

    List<SprintBurndownPointEntity> findAllBySprintId(UUID sprintId);
}
