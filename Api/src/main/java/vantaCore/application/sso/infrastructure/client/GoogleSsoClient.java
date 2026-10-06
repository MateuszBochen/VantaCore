package vantaCore.application.sso.infrastructure.client;

import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Component;
import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.login.SsoIdentity;
import vantaCore.application.sso.domain.login.SsoProviderException;
import vantaCore.application.sso.domain.vo.SsoProvider;

/** Google is plain OIDC at accounts.google.com - the only quirk is that Google documents BOTH
 "https://accounts.google.com" and bare "accounts.google.com" as valid id_token issuers. email_verified
 is always sent and must be true (enforced by SsoIdentityPolicy). */
@Component
public class GoogleSsoClient extends OpenIdConnectSsoClient {

    @Override
    public SsoProvider provider() {
        return SsoProvider.GOOGLE;
    }

    @Override
    protected String discoveryUrl(SsoProviderConfigAggregate config) {
        return "https://accounts.google.com/.well-known/openid-configuration";
    }

    @Override
    protected void verifyIssuer(Discovery discovery, Claims claims, SsoProviderConfigAggregate config) {
        String issuer = claims.getIssuer();
        if (!"https://accounts.google.com".equals(issuer) && !"accounts.google.com".equals(issuer)) {
            throw new SsoProviderException("Unexpected Google id_token issuer " + issuer);
        }
    }

    @Override
    protected SsoIdentity toIdentity(Claims claims, SsoProviderConfigAggregate config) {
        return new SsoIdentity(requireEmail(claims.get("email", String.class)), emailVerified(claims));
    }
}
