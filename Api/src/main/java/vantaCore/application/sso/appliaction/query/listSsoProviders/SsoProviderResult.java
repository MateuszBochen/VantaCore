package vantaCore.application.sso.appliaction.query.listSsoProviders;

import vantaCore.application.sso.domain.vo.SsoProvider;

/** The secret itself is never returned - only clientSecretSet, so the settings form can show
 "a secret is stored" and leave the field empty to keep it. */
public record SsoProviderResult(
    SsoProvider provider,
    boolean enabled,
    String clientId,
    boolean clientSecretSet,
    String tenantId,
    String issuerUrl,
    String displayName,
    boolean autoProvisionUsers
) {
}
