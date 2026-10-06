package vantaCore.application.sso.infrastructure.client;

import com.fasterxml.jackson.databind.JsonNode;
import io.jsonwebtoken.Claims;
import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.login.SsoAuthorizationRequest;
import vantaCore.application.sso.domain.login.SsoCodeExchange;
import vantaCore.application.sso.domain.login.SsoIdentity;
import vantaCore.application.sso.domain.login.SsoProviderClientInterface;
import vantaCore.application.sso.domain.login.SsoProviderException;

import java.util.LinkedHashMap;
import java.util.Map;

/** Authorization-code flow shared by every OpenID Connect provider (Google, Microsoft, generic OIDC):
 endpoints come from the provider's discovery document, the login URL carries state + nonce + a PKCE
 S256 challenge, and the code is redeemed server-side with the client secret + code_verifier. Who
 logged in is read ONLY from the verified id_token (IdTokenVerifier + verifyIssuer), never from an
 unauthenticated source. Subclasses supply the discovery URL, issuer rule and claim mapping. */
abstract class OpenIdConnectSsoClient implements SsoProviderClientInterface {

    protected record Discovery(String issuer, String authorizationEndpoint, String tokenEndpoint, String jwksUri) {
    }

    protected abstract String discoveryUrl(SsoProviderConfigAggregate config);

    /** Maps verified id_token claims to an identity - email must be present, else SsoProviderException. */
    protected abstract SsoIdentity toIdentity(Claims claims, SsoProviderConfigAggregate config);

    protected String scope() {
        return "openid email profile";
    }

    /** Default: the id_token's iss must equal the discovery document's issuer exactly. */
    protected void verifyIssuer(Discovery discovery, Claims claims, SsoProviderConfigAggregate config) {
        if (!discovery.issuer().equals(claims.getIssuer())) {
            throw new SsoProviderException("id_token issuer " + claims.getIssuer() + " != " + discovery.issuer());
        }
    }

    @Override
    public String authorizationUrl(SsoAuthorizationRequest request) {
        Discovery discovery = discover(request.config());

        Map<String, String> params = new LinkedHashMap<>();
        params.put("client_id", request.config().getClientId());
        params.put("redirect_uri", request.redirectUri());
        params.put("response_type", "code");
        params.put("scope", scope());
        params.put("state", request.state());
        params.put("nonce", request.nonce());
        params.put("code_challenge", request.codeChallenge());
        params.put("code_challenge_method", "S256");

        return SsoHttp.withQuery(discovery.authorizationEndpoint(), params);
    }

    @Override
    public SsoIdentity exchangeCode(SsoCodeExchange exchange) {
        SsoProviderConfigAggregate config = exchange.config();
        Discovery discovery = discover(config);

        Map<String, String> form = new LinkedHashMap<>();
        form.put("grant_type", "authorization_code");
        form.put("code", exchange.code());
        form.put("redirect_uri", exchange.redirectUri());
        form.put("client_id", config.getClientId());
        form.put("client_secret", config.getClientSecret());
        form.put("code_verifier", exchange.codeVerifier());

        JsonNode tokenResponse = SsoHttp.postForm(discovery.tokenEndpoint(), form);
        if (SsoHttp.text(tokenResponse, "error") != null) {
            throw new SsoProviderException("Token endpoint error: " + SsoHttp.text(tokenResponse, "error")
                + " " + SsoHttp.text(tokenResponse, "error_description"));
        }

        Claims claims = IdTokenVerifier.verify(
            SsoHttp.text(tokenResponse, "id_token"), discovery.jwksUri(), config.getClientId(), exchange.nonce()
        );
        verifyIssuer(discovery, claims, config);

        return toIdentity(claims, config);
    }

    protected Discovery discover(SsoProviderConfigAggregate config) {
        JsonNode document = SsoHttp.getJson(discoveryUrl(config), Map.of());

        Discovery discovery = new Discovery(
            SsoHttp.text(document, "issuer"),
            SsoHttp.text(document, "authorization_endpoint"),
            SsoHttp.text(document, "token_endpoint"),
            SsoHttp.text(document, "jwks_uri")
        );
        if (discovery.issuer() == null || discovery.authorizationEndpoint() == null
            || discovery.tokenEndpoint() == null || discovery.jwksUri() == null) {
            throw new SsoProviderException("Incomplete discovery document at " + discoveryUrl(config));
        }
        return discovery;
    }

    protected static String requireEmail(String email) {
        if (email == null || email.isBlank() || !email.contains("@")) {
            throw new SsoProviderException("Provider returned no usable email");
        }
        return email.trim();
    }

    /** email_verified is a JSON boolean per the spec, but some IdPs send the string "true". */
    protected static Boolean emailVerified(Claims claims) {
        return emailVerified(claims, "email_verified");
    }

    /** Same boolean-or-"true"-string leniency, for a differently named verification claim. */
    protected static Boolean emailVerified(Claims claims, String claimName) {
        Object value = claims.get(claimName);
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value instanceof String string) {
            return Boolean.parseBoolean(string);
        }
        return null;
    }

    protected static String trimTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
