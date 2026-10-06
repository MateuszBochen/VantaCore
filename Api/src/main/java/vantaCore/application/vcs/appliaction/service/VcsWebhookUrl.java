package vantaCore.application.vcs.appliaction.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import vantaCore.application.vcs.domain.vo.VcsConnectionId;
import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/** Absolute (not relative, unlike PublicFileUrl) since this gets pasted into a third-party
 provider's own webhook config, not resolved by our own frontend. Bitbucket Cloud has no
 header/HMAC-based webhook secret mechanism at all, unlike the other three - so for BITBUCKET the
 secret is embedded as a query parameter instead, and BitbucketWebhookVerifier reads it from there.
 See the Solution Design's per-provider signature scheme notes. */
@Component
public class VcsWebhookUrl {

    private final String publicBaseUrl;

    public VcsWebhookUrl(@Value("${app.public-base-url}") String publicBaseUrl) {
        this.publicBaseUrl = publicBaseUrl;
    }

    public String of(VcsProvider provider, VcsConnectionId connectionId, String webhookSecret) {
        String path = "/web-api/webhook/vcs/" + provider.name() + "/" + connectionId.value();
        String base = this.publicBaseUrl + path;

        if (provider == VcsProvider.BITBUCKET) {
            return base + "?token=" + URLEncoder.encode(webhookSecret, StandardCharsets.UTF_8);
        }

        return base;
    }
}
