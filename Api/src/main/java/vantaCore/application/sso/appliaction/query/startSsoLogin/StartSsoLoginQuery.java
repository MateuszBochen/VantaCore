package vantaCore.application.sso.appliaction.query.startSsoLogin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.sso.domain.vo.SsoProvider;

// Public (GET /web-api/auth/sso/{provider}/authorize) - no @RequiresResource, nobody is logged in
// yet. A query rather than a command despite storing a state row: like LoginQuery, its whole point
// is the data it hands back (the provider login URL).
final public class StartSsoLoginQuery {

    @NotNull
    private final SsoProvider provider;

    @NotBlank
    private final String redirectUri;

    public StartSsoLoginQuery(SsoProvider provider, String redirectUri) {
        this.provider = provider;
        this.redirectUri = redirectUri;
    }

    public SsoProvider getProvider() {
        return provider;
    }

    public String getRedirectUri() {
        return redirectUri;
    }
}
