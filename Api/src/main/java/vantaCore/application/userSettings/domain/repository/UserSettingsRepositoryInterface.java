package vantaCore.application.userSettings.domain.repository;

import vantaCore.application.userSettings.domain.UserSettingsAggregate;

import java.util.Optional;
import java.util.UUID;

public interface UserSettingsRepositoryInterface {

    /** empty when the user has never saved any settings yet - not an error, the caller just falls
     back to an empty blob (see GetUserSettingsQueryHandler). */
    Optional<UserSettingsAggregate> findByUserId(UUID userId);

    /** upsert - full replace, see UserSettingsAggregate. */
    void save(UserSettingsAggregate settings);
}
