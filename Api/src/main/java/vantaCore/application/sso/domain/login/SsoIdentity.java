package vantaCore.application.sso.domain.login;

/** What a provider told us about the person who just logged in. emailVerified is null when the
 provider doesn't say either way (Microsoft, most generic OIDC IdPs) - see SsoIdentityPolicy for
 how each provider's answer is judged. */
public record SsoIdentity(String email, Boolean emailVerified) {
}
