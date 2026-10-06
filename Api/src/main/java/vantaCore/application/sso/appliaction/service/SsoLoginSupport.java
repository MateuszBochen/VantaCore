package vantaCore.application.sso.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.policy.UpsertSsoProviderPolicy;
import vantaCore.application.sso.domain.repository.SsoProviderConfigRepositoryInterface;
import vantaCore.application.sso.domain.vo.SsoProvider;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

/** Bits shared by the authorize and callback handlers: loading a provider only if it's actually
 usable, the 422 shape every SSO error uses, and the random/PKCE values. */
@Component
public class SsoLoginSupport {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final SsoProviderConfigRepositoryInterface configRepository;
    private final UpsertSsoProviderPolicy configPolicy;

    public SsoLoginSupport(SsoProviderConfigRepositoryInterface configRepository, UpsertSsoProviderPolicy configPolicy) {
        this.configRepository = configRepository;
        this.configPolicy = configPolicy;
    }

    /** Enabled AND still passing the save-time rules - a row saved before a rule was added (e.g.
     Microsoft's single-tenant requirement) can't be used to log in until it's fixed. */
    public SsoProviderConfigAggregate usableConfig(SsoProvider provider) {
        return this.configRepository.findByProvider(provider)
            .filter(SsoProviderConfigAggregate::isEnabled)
            .filter(config -> this.configPolicy.check(config).isAllowed())
            .orElseThrow(() -> error("sso-provider-disabled", "This sign-in provider is not enabled"));
    }

    public static UnprocessableEntityException error(String code, String message) {
        return new UnprocessableEntityException(List.of(new Notification(code, message, true)));
    }

    /** 256 bits, base64url without padding (43 chars) - valid as state, nonce and a PKCE verifier. */
    public static String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** PKCE S256: base64url(sha256(verifier)), no padding (RFC 7636 section 4.2). */
    public static String codeChallenge(String codeVerifier) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
