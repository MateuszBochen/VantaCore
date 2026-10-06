package vantaCore.application.user.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.user.infrastructure.persistence.entity.UserEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataUserRepositoryInterface extends JpaRepository<UserEntity, UUID> {

    boolean existsByRoleIdsContains(UUID roleId);

    Optional<UserEntity> findByEmail(String email);

    List<UserEntity> findAllByEmailIgnoreCase(String email);

    List<UserSummaryProjection> findAllByOrderByFirstNameAscLastNameAsc();
}
