package vantaCore.application.sso.infrastructure.client;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwsHeader;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.LocatorAdapter;
import io.jsonwebtoken.security.Jwk;
import io.jsonwebtoken.security.JwkSet;
import io.jsonwebtoken.security.Jwks;
import io.jsonwebtoken.security.PublicJwk;
import vantaCore.application.sso.domain.login.SsoProviderException;

import java.security.Key;
import java.util.List;

/** Verifies an OIDC id_token: signature against the provider's published JWKS (jwks_uri from
 discovery), audience == our client id, not expired (60s clock skew), and nonce == the one this login
 sent. Issuer is checked by the caller (OpenIdConnectSsoClient.verifyIssuer), since Microsoft's
 issuer can be a per-tenant template rather than a fixed string. The JWKS is fetched fresh per login
 - logins are rare enough that caching it isn't worth a key-rotation bug. */
final class IdTokenVerifier {

    private IdTokenVerifier() {
    }

    static Claims verify(String idToken, String jwksUri, String clientId, String expectedNonce) {
        if (idToken == null) {
            throw new SsoProviderException("Token response has no id_token");
        }

        JwkSet jwks;
        try {
            jwks = Jwks.setParser().build().parse(SsoHttp.getText(jwksUri));
        } catch (JwtException | IllegalArgumentException exception) {
            throw new SsoProviderException("Unreadable JWKS at " + jwksUri, exception);
        }
        List<PublicJwk<?>> keys = jwks.getKeys().stream()
            .filter(jwk -> jwk instanceof PublicJwk<?>)
            .<PublicJwk<?>>map(jwk -> (PublicJwk<?>) jwk)
            .toList();

        Claims claims;
        try {
            claims = Jwts.parser()
                .keyLocator(new LocatorAdapter<Key>() {
                    @Override
                    protected Key locate(JwsHeader header) {
                        return findKey(keys, header.getKeyId());
                    }
                })
                .requireAudience(clientId)
                .clockSkewSeconds(60)
                .build()
                .parseSignedClaims(idToken)
                .getPayload();
        } catch (JwtException | IllegalArgumentException exception) {
            throw new SsoProviderException("id_token verification failed: " + exception.getMessage(), exception);
        }

        if (!expectedNonce.equals(claims.get("nonce", String.class))) {
            throw new SsoProviderException("id_token nonce does not match this login");
        }

        return claims;
    }

    private static Key findKey(List<PublicJwk<?>> keys, String keyId) {
        if (keyId == null && keys.size() == 1) {
            return keys.get(0).toKey();
        }
        return keys.stream()
            .filter(jwk -> keyId != null && keyId.equals(jwk.getId()))
            .map(Jwk::toKey)
            .findFirst()
            .orElseThrow(() -> new SsoProviderException("No JWKS key matches id_token kid " + keyId));
    }
}
