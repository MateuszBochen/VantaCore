package vantaCore.application.userSettings.appliaction.query.getOpenSettings;

import java.util.List;

/** What the frontend needs before anyone is logged in (e.g. which SSO buttons the login page
 shows). Served to anonymous callers, so it only ever carries public, non-credential data -
 never client ids/secrets/tenant ids/issuer URLs, which the (backend-driven) SSO flow doesn't need
 the browser to know. */
public record OpenSettingsResult(List<OpenSsoProviderResult> sso) {
}
