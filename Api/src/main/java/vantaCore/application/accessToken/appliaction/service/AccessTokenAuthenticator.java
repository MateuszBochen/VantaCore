package vantaCore.application.accessToken.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.accessToken.domain.PersonalAccessTokenAggregate;
import vantaCore.application.accessToken.domain.repository.PersonalAccessTokenRepositoryInterface;
import vantaCore.application.accessToken.domain.vo.AccessTokenSecret;
import vantaCore.application.shared.application.exception.UserNotFoundException;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** Turns a raw "vc_pat_..." bearer value into who is calling and what they may do - used by the
 security module's AccessTokenAuthenticationFilter on every token-authenticated request. Empty =
 not a valid token (unknown, expired, or its user is gone) - the filter then simply leaves the
 request unauthenticated, same as an invalid JWT. Permissions are recomputed from the user's roles
 every time (see PersonalAccessTokenAggregate.effectiveResources). */
@Component
public class AccessTokenAuthenticator {

    public record AuthenticatedAccessToken(UUID userId, Set<Resource> resources) {
    }

    private final PersonalAccessTokenRepositoryInterface repository;
    private final UserAggregateRepositoryInterface userRepository;
    private final UserResourceLookup userResourceLookup;

    public AccessTokenAuthenticator(
        PersonalAccessTokenRepositoryInterface repository,
        UserAggregateRepositoryInterface userRepository,
        UserResourceLookup userResourceLookup
    ) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.userResourceLookup = userResourceLookup;
    }

    public Optional<AuthenticatedAccessToken> authenticate(String rawToken) {
        if (!AccessTokenSecret.looksLikeAccessToken(rawToken)) {
            return Optional.empty();
        }

        Instant now = Instant.now();
        Optional<PersonalAccessTokenAggregate> found = this.repository.findByTokenHash(AccessTokenSecret.hash(rawToken))
            .filter(token -> !token.isExpired(now));
        if (found.isEmpty()) {
            return Optional.empty();
        }
        PersonalAccessTokenAggregate token = found.get();

        UserAggregate user;
        try {
            user = this.userRepository.findById(new UserId(token.getUserId()));
        } catch (UserNotFoundException exception) {
            return Optional.empty();
        }

        if (token.shouldRecordUse(now)) {
            this.repository.recordUse(token.getId(), now);
        }

        return Optional.of(new AuthenticatedAccessToken(
            token.getUserId(),
            token.effectiveResources(this.userResourceLookup.resourcesOf(user))
        ));
    }
}
