package vantaCore.application.accessToken.appliaction.query.createAccessToken;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** token is the plaintext secret - returned exactly once, here; it can never be read back later. */
public record CreatedAccessTokenResult(
    UUID id,
    String name,
    String token,
    String tokenPrefix,
    List<String> resources,
    Instant createdAt,
    Instant expiresAt
) {
}
