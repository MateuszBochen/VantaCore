package vantaCore.application.vcs.infrastructure.webhook;

import org.springframework.stereotype.Component;
import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;

/** Azure DevOps Service Hooks authenticate their outbound calls via HTTP Basic Auth configured on
 the hook itself (username + password), not payload signing. The username is ignored - only the
 password half is compared against the stored secret, so whatever username gets configured on the
 Azure DevOps side doesn't matter. */
@Component
public class AzureDevOpsWebhookVerifier implements VcsWebhookVerifierInterface {

    private static final String HEADER = "authorization";
    private static final String BASIC_PREFIX = "Basic ";

    @Override
    public VcsProvider provider() {
        return VcsProvider.AZURE_DEVOPS;
    }

    @Override
    public boolean verify(Map<String, String> headers, String queryToken, String rawBody, String webhookSecret) {
        String header = headers.get(HEADER);
        if (header == null || !header.startsWith(BASIC_PREFIX)) {
            return false;
        }

        try {
            String decoded = new String(Base64.getDecoder().decode(header.substring(BASIC_PREFIX.length())), StandardCharsets.UTF_8);
            int separator = decoded.indexOf(':');
            if (separator < 0) {
                return false;
            }

            String password = decoded.substring(separator + 1);
            return MessageDigest.isEqual(password.getBytes(StandardCharsets.UTF_8), webhookSecret.getBytes(StandardCharsets.UTF_8));
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }
}
