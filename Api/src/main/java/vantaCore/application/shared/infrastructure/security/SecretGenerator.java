package vantaCore.application.shared.infrastructure.security;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;

/** Generates a random shared secret this app hands to the caller once (VCS webhook secrets, GENERIC
 webhook subscription secrets) - 32 random bytes, base64url-encoded (no padding): long enough to be
 infeasible to guess, URL-safe so it can also ride in a query parameter where a header isn't an
 option (see VcsWebhookUrl's BITBUCKET case). */
@Component
public class SecretGenerator {

    private static final int SECRET_BYTES = 32;
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generate() {
        byte[] bytes = new byte[SECRET_BYTES];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
