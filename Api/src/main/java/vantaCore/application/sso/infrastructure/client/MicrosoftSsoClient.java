package vantaCore.application.sso.infrastructure.client;

import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Component;
import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.login.SsoIdentity;
import vantaCore.application.sso.domain.login.SsoProviderException;
import vantaCore.application.sso.domain.policy.UpsertSsoProviderPolicy;
import vantaCore.application.sso.domain.vo.SsoProvider;

/** Microsoft Entra ID v2.0 endpoints for the configured tenant
 (login.microsoftonline.com/{tenantId}/v2.0) - a specific tenant, or a multi-tenant alias
 (common/organizations/consumers). The id_token's iss must match the discovery issuer, which for the
 aliases is a "{tenantid}" template resolved against the token's own tid.

 Which claim is trusted as the email depends on that (see toIdentity): Microsoft's `email` claim is
 the account's mail attribute, which a tenant's admin can set to ANY address - fine when the tenant
 is our own single configured one, but with a multi-tenant alias a foreign tenant could put one of
 OUR users' addresses there and log in as them ("nOAuth"). So for aliases, `email` is used only when
 Microsoft marks its domain as verified (the xms_edov optional claim), and otherwise the sign-in
 name preferred_username (UPN / personal account email) - a UPN can only use a domain verified by
 the tenant that issued it. */
@Component
public class MicrosoftSsoClient extends OpenIdConnectSsoClient {

    @Override
    public SsoProvider provider() {
        return SsoProvider.MICROSOFT;
    }

    @Override
    protected String discoveryUrl(SsoProviderConfigAggregate config) {
        return "https://login.microsoftonline.com/" + config.getTenantId() + "/v2.0/.well-known/openid-configuration";
    }

    @Override
    protected void verifyIssuer(Discovery discovery, Claims claims, SsoProviderConfigAggregate config) {
        String tid = claims.get("tid", String.class);
        if (tid == null) {
            throw new SsoProviderException("Microsoft id_token has no tid");
        }

        String expectedIssuer = discovery.issuer().replace("{tenantid}", tid);
        if (!expectedIssuer.equals(claims.getIssuer())) {
            throw new SsoProviderException("Microsoft id_token issuer " + claims.getIssuer() + " != " + expectedIssuer);
        }
    }

    @Override
    protected SsoIdentity toIdentity(Claims claims, SsoProviderConfigAggregate config) {
        String email = claims.get("email", String.class);
        String preferredUsername = claims.get("preferred_username", String.class);

        boolean multiTenant = !UpsertSsoProviderPolicy.isSingleTenant(config.getTenantId());
        boolean emailTrusted = !multiTenant || Boolean.TRUE.equals(emailVerified(claims, "xms_edov"));

        String chosen = emailTrusted && email != null && !email.isBlank() ? email : preferredUsername;
        return new SsoIdentity(requireEmail(chosen), null);
    }
}
