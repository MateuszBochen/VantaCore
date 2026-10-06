package vantaCore.application.accessToken.appliaction.query.createAccessToken;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.accessToken.appliaction.dto.CreateAccessTokenRequest;

// Self-scoped (always the caller's own tokens) - no @RequiresResource, same as user-settings/avatar.
// A query, not a command: like CreateWebhookSubscriptionQuery, its point is the one-time secret it
// hands back.
final public class CreateAccessTokenQuery {

    @Valid
    @NotNull
    private final CreateAccessTokenRequest createAccessTokenRequest;

    public CreateAccessTokenQuery(CreateAccessTokenRequest createAccessTokenRequest) {
        this.createAccessTokenRequest = createAccessTokenRequest;
    }

    public CreateAccessTokenRequest getCreateAccessTokenRequest() {
        return createAccessTokenRequest;
    }
}
