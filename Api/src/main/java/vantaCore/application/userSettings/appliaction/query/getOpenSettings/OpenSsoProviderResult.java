package vantaCore.application.userSettings.appliaction.query.getOpenSettings;

import vantaCore.application.sso.domain.vo.SsoProvider;

/** settings is provider-specific and null when the provider has nothing public to add - today
 only OIDC does (OidcSettings: the button label, since "OIDC" itself means nothing to a user).
 Microsoft/Google/GitHub buttons are fully identified by the provider alone. */
public record OpenSsoProviderResult(SsoProvider provider, boolean enabled, Object settings) {

    public record OidcSettings(String displayName) {
    }
}
