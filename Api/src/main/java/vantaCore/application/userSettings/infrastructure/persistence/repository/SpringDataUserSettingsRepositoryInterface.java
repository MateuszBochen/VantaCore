package vantaCore.application.userSettings.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.userSettings.infrastructure.persistence.entity.UserSettingsEntity;

import java.util.UUID;

public interface SpringDataUserSettingsRepositoryInterface extends JpaRepository<UserSettingsEntity, UUID> {
}
