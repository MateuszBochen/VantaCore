package vantaCore.application.accessToken.domain.vo;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/** The plaintext token format and how it's stored. "vc_pat_" + 256 random bits (base64url) - the
 prefix lets the auth filter tell a personal access token from a JWT without trying to parse it,
 and makes a leaked token easy to recognize (e.g. by secret scanners). Only a SHA-256 hash is ever
 stored: with 256 bits of randomness a fast hash is as safe as bcrypt here (nothing to brute-force)
 and lets a request be authenticated with a single indexed lookup. */
public final class AccessTokenSecret {

    public static final String PREFIX = "vc_pat_";
    // "vc_pat_" + the first 5 random chars - enough for a user to tell their tokens apart in a list.
    private static final int DISPLAY_PREFIX_LENGTH = PREFIX.length() + 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private AccessTokenSecret() {
    }

    public static String generate() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return PREFIX + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static boolean looksLikeAccessToken(String value) {
        return value != null && value.startsWith(PREFIX);
    }

    public static String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    public static String displayPrefix(String rawToken) {
        return rawToken.substring(0, Math.min(DISPLAY_PREFIX_LENGTH, rawToken.length()));
    }
}
