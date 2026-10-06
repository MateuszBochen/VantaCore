package vantaCore.application.sso.domain.vo;

import java.util.Locale;

/** The fixed set of SSO identity providers VantaCore can be configured against - one configuration
 row per provider at most (see SsoProviderConfigAggregate), not an open-ended list. OIDC is the
 generic "any OpenID Connect issuer" option (Okta, Keycloak, Auth0, ...), which is why only it
 carries an issuerUrl/displayName of its own. */
public enum SsoProvider {
    MICROSOFT,
    GOOGLE,
    GITHUB,
    OIDC;

    /** "microsoft" -> MICROSOFT, case-insensitive - the form used in PUT /api/settings/sso/{provider}. */
    public static SsoProvider fromPathValue(String value) {
        return SsoProvider.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
