package vantaCore.application.accessToken.domain;

import vantaCore.application.accessToken.domain.vo.AccessTokenId;
import vantaCore.application.accessToken.domain.vo.AccessTokenSecret;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/** A long-lived credential a user creates for non-browser clients (MCP clients, scripts) - it acts
 AS that user, never as more. scopes empty = everything the user can do; non-empty = only those
 resources, and only while the user still has them (see effectiveResources): permissions are
 resolved from the user's roles on every request, so a role change or a lost permission applies to
 existing tokens immediately. The plaintext token exists only in the IssuedAccessToken returned at
 creation - the aggregate itself only ever holds its hash. */
public class PersonalAccessTokenAggregate {

    // last_used_at is informational ("used 3 minutes ago") - not written on every single request.
    private static final Duration LAST_USED_RESOLUTION = Duration.ofMinutes(5);

    private final AccessTokenId id;
    private final UUID userId;
    private final String name;
    private final String tokenHash;
    private final String tokenPrefix;
    private final Set<Resource> scopes;
    private final Instant createdAt;
    private final Instant expiresAt;
    private final Instant lastUsedAt;

    private PersonalAccessTokenAggregate(
        AccessTokenId id,
        UUID userId,
        String name,
        String tokenHash,
        String tokenPrefix,
        Set<Resource> scopes,
        Instant createdAt,
        Instant expiresAt,
        Instant lastUsedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.tokenHash = tokenHash;
        this.tokenPrefix = tokenPrefix;
        this.scopes = scopes == null || scopes.isEmpty() ? Set.of() : Set.copyOf(scopes);
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.lastUsedAt = lastUsedAt;
    }

    public record IssuedAccessToken(PersonalAccessTokenAggregate token, String plaintext) {
    }

    /** Creates a token with a freshly generated secret - the only moment the plaintext exists. */
    public static IssuedAccessToken issue(
        AccessTokenId id,
        UUID userId,
        String name,
        Set<Resource> scopes,
        Instant expiresAt,
        Instant now
    ) {
        String plaintext = AccessTokenSecret.generate();
        PersonalAccessTokenAggregate token = new PersonalAccessTokenAggregate(
            id, userId, name.trim(), AccessTokenSecret.hash(plaintext), AccessTokenSecret.displayPrefix(plaintext),
            scopes, now, expiresAt, null
        );
        return new IssuedAccessToken(token, plaintext);
    }

    public static PersonalAccessTokenAggregate restore(
        AccessTokenId id,
        UUID userId,
        String name,
        String tokenHash,
        String tokenPrefix,
        Set<Resource> scopes,
        Instant createdAt,
        Instant expiresAt,
        Instant lastUsedAt
    ) {
        return new PersonalAccessTokenAggregate(id, userId, name, tokenHash, tokenPrefix, scopes, createdAt, expiresAt, lastUsedAt);
    }

    public boolean isExpired(Instant now) {
        return this.expiresAt != null && !now.isBefore(this.expiresAt);
    }

    public boolean shouldRecordUse(Instant now) {
        return this.lastUsedAt == null || this.lastUsedAt.plus(LAST_USED_RESOLUTION).isBefore(now);
    }

    /** What this token may do right now: the user's current resources, narrowed to scopes if any. */
    public Set<Resource> effectiveResources(Set<Resource> userResources) {
        if (this.scopes.isEmpty()) {
            return userResources;
        }
        return userResources.stream().filter(this.scopes::contains).collect(Collectors.toCollection(() -> EnumSet.noneOf(Resource.class)));
    }

    public AccessTokenId getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public String getTokenPrefix() {
        return tokenPrefix;
    }

    public Set<Resource> getScopes() {
        return scopes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getLastUsedAt() {
        return lastUsedAt;
    }
}
