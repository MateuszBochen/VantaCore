package vantaCore.application.vcs.appliaction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.vcs.domain.VcsConnectionSnapshot;
import vantaCore.application.vcs.domain.repository.VcsConnectionRepositoryInterface;
import vantaCore.application.vcs.domain.vo.VcsConnectionId;
import vantaCore.application.vcs.domain.vo.VcsProvider;
import vantaCore.application.vcs.infrastructure.webhook.VcsWebhookHandlerInterface;
import vantaCore.application.vcs.infrastructure.webhook.VcsWebhookVerifierInterface;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Orchestrates one inbound delivery: look up the connection, verify its signature, resolve the
 project, hand off to the matching provider's VcsWebhookHandlerInterface. Called by
 VcsWebhookController, not the command/query bus - a webhook sender doesn't send a JWT and doesn't
 parse the standard notification envelope, it only cares about the HTTP status code. */
@Component
public class VcsWebhookProcessor {

    private static final Logger log = LoggerFactory.getLogger(VcsWebhookProcessor.class);

    private final VcsConnectionRepositoryInterface connectionRepository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final Map<VcsProvider, VcsWebhookVerifierInterface> verifiers;
    private final Map<VcsProvider, VcsWebhookHandlerInterface> handlers;
    private final ObjectMapper objectMapper;

    public VcsWebhookProcessor(
        VcsConnectionRepositoryInterface connectionRepository,
        ProjectAggregateRepositoryInterface projectRepository,
        List<VcsWebhookVerifierInterface> verifiers,
        List<VcsWebhookHandlerInterface> handlers,
        ObjectMapper objectMapper
    ) {
        this.connectionRepository = connectionRepository;
        this.projectRepository = projectRepository;
        this.objectMapper = objectMapper;

        this.verifiers = new HashMap<>();
        for (VcsWebhookVerifierInterface verifier : verifiers) {
            this.verifiers.put(verifier.provider(), verifier);
        }

        this.handlers = new HashMap<>();
        for (VcsWebhookHandlerInterface handler : handlers) {
            this.handlers.put(handler.provider(), handler);
        }
    }

    /** true = verified and (best-effort) processed, caller should respond 200. false = signature
     didn't verify, unknown connection, or a provider/connection mismatch - caller should respond
     401, never leaking which of those it was (same "don't distinguish missing from wrong" stance as
     everywhere else this app returns a generic failure for a privately-scoped lookup). */
    public boolean process(VcsProvider provider, UUID connectionId, Map<String, String> headers, String queryToken, String rawBody) {
        VcsConnectionSnapshot connection = this.connectionRepository.findById(new VcsConnectionId(connectionId)).orElse(null);
        if (connection == null || connection.provider() != provider) {
            return false;
        }

        VcsWebhookVerifierInterface verifier = this.verifiers.get(provider);
        if (verifier == null || !verifier.verify(headers, queryToken, rawBody, connection.webhookSecret())) {
            return false;
        }

        ProjectAggregate project = this.projectRepository.findById(new ProjectId(connection.projectId())).orElse(null);
        if (project == null) {
            return true;
        }

        VcsWebhookHandlerInterface handler = this.handlers.get(provider);
        if (handler == null) {
            return true;
        }

        try {
            JsonNode payload = this.objectMapper.readTree(rawBody);
            handler.handle(project, headers, payload);
        } catch (Exception exception) {
            // A malformed/unexpected payload shape from an otherwise-verified sender is logged, not
            // failed back to the sender - most providers retry/disable a hook on repeated non-2xx
            // responses, and one bad delivery shouldn't do that.
            log.warn("Failed to process {} webhook for connection {}", provider, connectionId, exception);
        }

        return true;
    }
}
