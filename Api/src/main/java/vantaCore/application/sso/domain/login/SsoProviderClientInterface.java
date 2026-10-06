package vantaCore.application.sso.domain.login;

import vantaCore.application.sso.domain.vo.SsoProvider;

/** Port over one identity provider's OAuth2/OIDC endpoints - one implementation per SsoProvider
 (see the infrastructure.client package). Both methods throw SsoProviderException when the provider
 can't be reached or rejects the request, so callers map every provider-side failure to the same
 sso-provider-error. */
public interface SsoProviderClientInterface {

    SsoProvider provider();

    String authorizationUrl(SsoAuthorizationRequest request);

    /** Redeems the code and returns who logged in - id_token signature/issuer/audience/nonce are
     verified inside (OIDC-based providers), never left to the caller. */
    SsoIdentity exchangeCode(SsoCodeExchange exchange);
}
