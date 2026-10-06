package vantaCore.application.accessToken.domain.repository;

import vantaCore.application.accessToken.domain.PersonalAccessTokenAggregate;
import vantaCore.application.accessToken.domain.vo.AccessTokenId;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PersonalAccessTokenRepositoryInterface {

    void save(PersonalAccessTokenAggregate token);

    Optional<PersonalAccessTokenAggregate> findById(AccessTokenId id);

    Optional<PersonalAccessTokenAggregate> findByTokenHash(String tokenHash);

    List<PersonalAccessTokenAggregate> findAllByUserId(UUID userId);

    long countByUserId(UUID userId);

    /** A single-column update, not a full save - it runs on the request path of every API call
     made with a token, and must not race a concurrent revoke into resurrecting the row. */
    void recordUse(AccessTokenId id, Instant usedAt);

    void deleteById(AccessTokenId id);
}
