package vantaCore.application.sso.appliaction.query.completeSsoLogin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.sso.appliaction.dto.SsoCallbackRequest;
import vantaCore.application.sso.domain.vo.SsoProvider;

// Public (POST /web-api/auth/sso/{provider}/callback) - no @RequiresResource.
final public class CompleteSsoLoginQuery {

    @NotNull
    private final SsoProvider provider;

    @Valid
    @NotNull
    private final SsoCallbackRequest ssoCallbackRequest;

    public CompleteSsoLoginQuery(SsoProvider provider, SsoCallbackRequest ssoCallbackRequest) {
        this.provider = provider;
        this.ssoCallbackRequest = ssoCallbackRequest;
    }

    public SsoProvider getProvider() {
        return provider;
    }

    public SsoCallbackRequest getSsoCallbackRequest() {
        return ssoCallbackRequest;
    }
}
