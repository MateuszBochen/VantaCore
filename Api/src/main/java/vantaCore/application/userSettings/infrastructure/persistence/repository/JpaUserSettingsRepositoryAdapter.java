package vantaCore.application.userSettings.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.userSettings.domain.UserSettingsAggregate;
import vantaCore.application.userSettings.domain.repository.UserSettingsRepositoryInterface;
import vantaCore.application.userSettings.infrastructure.persistence.entity.UserSettingsEntity;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaUserSettingsRepositoryAdapter implements UserSettingsRepositoryInterface {

    private final SpringDataUserSettingsRepositoryInterface repository;

    public JpaUserSettingsRepositoryAdapter(SpringDataUserSettingsRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Optional<UserSettingsAggregate> findByUserId(UUID userId) {
        return this.repository.findById(userId).map(UserSettingsEntity::toDomain);
    }

    @Override
    public void save(UserSettingsAggregate settings) {
        this.repository.save(UserSettingsEntity.fromDomain(settings, Instant.now()));
    }
}
