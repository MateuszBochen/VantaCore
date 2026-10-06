package vantaCore.application.sso.infrastructure.client;

import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Component;
import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.login.SsoIdentity;
import vantaCore.application.sso.domain.login.SsoProviderException;
import vantaCore.application.sso.domain.vo.SsoProvider;

/** Any OpenID Connect issuer (Okta, Keycloak, Auth0, ...) configured by its issuerUrl. Per OIDC
 Discovery the document's issuer - and so every id_token's iss - must be exactly the configured
 issuer URL; a mismatch means the URL points somewhere else than the admin intended. */
@Component
public class GenericOidcSsoClient extends OpenIdConnectSsoClient {

    @Override
    public SsoProvider provider() {
        return SsoProvider.OIDC;
    }

    @Override
    protected String discoveryUrl(SsoProviderConfigAggregate config) {
        return trimTrailingSlash(config.getIssuerUrl()) + "/.well-known/openid-configuration";
    }

    @Override
    protected void verifyIssuer(Discovery discovery, Claims claims, SsoProviderConfigAggregate config) {
        if (!trimTrailingSlash(discovery.issuer()).equals(trimTrailingSlash(config.getIssuerUrl()))) {
            throw new SsoProviderException("Discovery issuer " + discovery.issuer() + " != configured " + config.getIssuerUrl());
        }
        super.verifyIssuer(discovery, claims, config);
    }

    @Override
    protected SsoIdentity toIdentity(Claims claims, SsoProviderConfigAggregate config) {
        return new SsoIdentity(requireEmail(claims.get("email", String.class)), emailVerified(claims));
    }
}
