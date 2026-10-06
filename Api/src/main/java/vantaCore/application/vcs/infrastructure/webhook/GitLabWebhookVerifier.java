package vantaCore.application.vcs.infrastructure.webhook;

import org.springframework.stereotype.Component;
import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

/** GitLab sends the shared secret verbatim as `X-Gitlab-Token` (no HMAC signing scheme, unlike
 GitHub) - a direct comparison, constant-time to avoid a timing side-channel on the secret. */
@Component
public class GitLabWebhookVerifier implements VcsWebhookVerifierInterface {

    private static final String HEADER = "x-gitlab-token";

    @Override
    public VcsProvider provider() {
        return VcsProvider.GITLAB;
    }

    @Override
    public boolean verify(Map<String, String> headers, String queryToken, String rawBody, String webhookSecret) {
        String token = headers.get(HEADER);
        if (token == null) {
            return false;
        }

        return MessageDigest.isEqual(token.getBytes(StandardCharsets.UTF_8), webhookSecret.getBytes(StandardCharsets.UTF_8));
    }
}
