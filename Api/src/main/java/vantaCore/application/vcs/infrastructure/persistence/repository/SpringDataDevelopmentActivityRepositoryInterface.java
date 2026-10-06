package vantaCore.application.vcs.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.vcs.infrastructure.persistence.entity.DevelopmentActivityEntity;

import java.util.UUID;

public interface SpringDataDevelopmentActivityRepositoryInterface extends JpaRepository<DevelopmentActivityEntity, UUID> {
}
