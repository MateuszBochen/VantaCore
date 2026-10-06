package vantaCore.application.sso.domain.login;

import vantaCore.application.sso.domain.SsoProviderConfigAggregate;

/** Everything a provider client needs to redeem an authorization code - redirectUri must be the
 exact one the authorize step used (providers compare them), codeVerifier/nonce come from the
 consumed SsoLoginState. */
public record SsoCodeExchange(
    SsoProviderConfigAggregate config,
    String code,
    String redirectUri,
    String codeVerifier,
    String nonce
) {
}
