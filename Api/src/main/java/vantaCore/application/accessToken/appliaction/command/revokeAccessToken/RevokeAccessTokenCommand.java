package vantaCore.application.accessToken.appliaction.command.revokeAccessToken;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

// Self-scoped - only the caller's own tokens, no @RequiresResource. Allowed from a token-authenticated
// request too: revoking can only ever reduce access.
final public class RevokeAccessTokenCommand {

    @NotNull
    private final UUID tokenId;

    public RevokeAccessTokenCommand(UUID tokenId) {
        this.tokenId = tokenId;
    }

    public UUID getTokenId() {
        return tokenId;
    }
}
