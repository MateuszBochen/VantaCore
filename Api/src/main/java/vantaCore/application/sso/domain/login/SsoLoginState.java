package vantaCore.application.sso.domain.login;

import vantaCore.application.sso.domain.vo.SsoProvider;

import java.time.Duration;
import java.time.Instant;

/** One in-flight SSO login, created by the authorize step and consumed (exactly once) by the
 callback. state is the OAuth2 anti-CSRF value echoed back by the provider; codeVerifier is the PKCE
 secret half (only its S256 hash went to the provider); nonce binds the returned id_token to this
 exact login. Bound to provider + redirectUri so a state issued for one provider/front route can't be
 replayed through another. */
public record SsoLoginState(
    String state,
    SsoProvider provider,
    String redirectUri,
    String codeVerifier,
    String nonce,
    Instant expiresAt
) {
    public static final Duration TIME_TO_LIVE = Duration.ofMinutes(10);

    public boolean isValidFor(SsoProvider provider, String redirectUri, Instant now) {
        return this.provider == provider && this.redirectUri.equals(redirectUri) && now.isBefore(this.expiresAt);
    }
}
