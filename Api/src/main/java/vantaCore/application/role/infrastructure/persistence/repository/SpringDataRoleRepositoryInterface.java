package vantaCore.application.role.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.role.infrastructure.persistence.entity.RoleEntity;

import java.util.Optional;
import java.util.UUID;

public interface SpringDataRoleRepositoryInterface extends JpaRepository<RoleEntity, UUID> {

    Optional<RoleEntity> findByName(String name);

    boolean existsByName(String name);

    Optional<RoleEntity> findByIsSystemTrue();
}
