package vantaCore.application.accessToken.appliaction.query.listAccessTokens;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Never the secret - tokenPrefix ("vc_pat_AbC12") is all that identifies it. resources empty =
 the token can do everything its user can. */
public record AccessTokenResult(
    UUID id,
    String name,
    String tokenPrefix,
    List<String> resources,
    Instant createdAt,
    Instant expiresAt,
    Instant lastUsedAt,
    boolean expired
) {
}
