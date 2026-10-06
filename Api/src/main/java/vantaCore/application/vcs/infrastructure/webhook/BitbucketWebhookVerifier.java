package vantaCore.application.vcs.infrastructure.webhook;

import org.springframework.stereotype.Component;
import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

/** Bitbucket Cloud has no built-in webhook signing/shared-secret mechanism at all (unlike the other
 three providers) - there is no header VantaCore could verify against. As a pragmatic workaround,
 the secret is embedded as a `?token=` query parameter in the generated webhook URL itself (see
 VcsWebhookUrl), and this just compares that against the stored secret. Weaker than HMAC (a query
 param can leak into access logs/proxies more easily than a header), but it's the best available
 given Bitbucket's own limitation - flagged explicitly, not silently assumed equivalent to the
 other three. */
@Component
public class BitbucketWebhookVerifier implements VcsWebhookVerifierInterface {

    @Override
    public VcsProvider provider() {
        return VcsProvider.BITBUCKET;
    }

    @Override
    public boolean verify(Map<String, String> headers, String queryToken, String rawBody, String webhookSecret) {
        if (queryToken == null) {
            return false;
        }

        return MessageDigest.isEqual(queryToken.getBytes(StandardCharsets.UTF_8), webhookSecret.getBytes(StandardCharsets.UTF_8));
    }
}
