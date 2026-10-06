package vantaCore.application.vcs.infrastructure.webhook;

import org.springframework.stereotype.Component;
import vantaCore.application.vcs.domain.vo.VcsProvider;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;

/** GitHub signs the raw request body with HMAC-SHA256 and sends it as
 `X-Hub-Signature-256: sha256=<hex>`. */
@Component
public class GitHubWebhookVerifier implements VcsWebhookVerifierInterface {

    private static final String HEADER = "x-hub-signature-256";
    private static final String ALGORITHM = "HmacSHA256";

    @Override
    public VcsProvider provider() {
        return VcsProvider.GITHUB;
    }

    @Override
    public boolean verify(Map<String, String> headers, String queryToken, String rawBody, String webhookSecret) {
        String header = headers.get(HEADER);
        if (header == null || !header.startsWith("sha256=")) {
            return false;
        }

        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), ALGORITHM));
            byte[] computed = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String computedHex = HexFormat.of().formatHex(computed);

            return MessageDigest.isEqual(computedHex.getBytes(StandardCharsets.UTF_8), header.substring("sha256=".length()).getBytes(StandardCharsets.UTF_8));
        } catch (Exception exception) {
            return false;
        }
    }
}
