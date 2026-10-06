package vantaCore.application.sso.domain.login;

import vantaCore.application.sso.domain.SsoProviderConfigAggregate;

/** Everything a provider client needs to build its login URL - codeChallenge is the S256 hash of
 SsoLoginState.codeVerifier. */
public record SsoAuthorizationRequest(
    SsoProviderConfigAggregate config,
    String redirectUri,
    String state,
    String codeChallenge,
    String nonce
) {
}
