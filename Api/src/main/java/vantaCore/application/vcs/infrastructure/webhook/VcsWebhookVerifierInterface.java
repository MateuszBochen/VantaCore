package vantaCore.application.vcs.infrastructure.webhook;

import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.util.Map;

/** One implementation per provider - each provider signs/authenticates inbound deliveries
 differently (see the concrete classes), unlike everything else in this sub-project which is
 otherwise fully abstracted behind DevelopmentActivityAggregate. */
public interface VcsWebhookVerifierInterface {

    VcsProvider provider();

    /** headers keyed lower-case (case-insensitive HTTP header matching, done once at the
     controller boundary rather than per-verifier). queryToken is the raw "token" query param, only
     meaningful for BITBUCKET (see VcsWebhookUrl). */
    boolean verify(Map<String, String> headers, String queryToken, String rawBody, String webhookSecret);
}
