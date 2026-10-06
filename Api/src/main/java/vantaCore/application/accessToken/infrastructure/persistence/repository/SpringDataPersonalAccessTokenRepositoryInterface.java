package vantaCore.application.accessToken.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.accessToken.infrastructure.persistence.entity.PersonalAccessTokenEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataPersonalAccessTokenRepositoryInterface extends JpaRepository<PersonalAccessTokenEntity, UUID> {

    Optional<PersonalAccessTokenEntity> findByTokenHash(String tokenHash);

    List<PersonalAccessTokenEntity> findAllByUserId(UUID userId);

    long countByUserId(UUID userId);
}
