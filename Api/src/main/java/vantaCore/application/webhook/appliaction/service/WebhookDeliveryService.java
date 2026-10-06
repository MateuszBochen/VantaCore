package vantaCore.application.webhook.appliaction.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import vantaCore.application.comment.domain.CommentSnapshot;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.webhook.domain.WebhookDeliveryAggregate;
import vantaCore.application.webhook.domain.WebhookSubscriptionSnapshot;
import vantaCore.application.webhook.domain.repository.WebhookDeliveryRepositoryInterface;
import vantaCore.application.webhook.domain.repository.WebhookSubscriptionRepositoryInterface;
import vantaCore.application.webhook.domain.vo.WebhookDeliveryId;
import vantaCore.application.webhook.domain.vo.WebhookDeliveryStatus;
import vantaCore.application.webhook.domain.vo.WebhookEventType;
import vantaCore.application.webhook.domain.vo.WebhookTargetType;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executor;

/** Entry point for all 4 domain events (see the appliaction.eventHandler classes) - one more
 consumer of the existing domain event bus, per the sub-project's own ADR (Webhooks/Automation
 Engine/Audit Log are three independent consumers of the same event stream, not three separate
 pipelines). Every public entry point immediately hands off to webhookDeliveryExecutor and returns,
 so a slow/unreachable third-party endpoint never adds latency to (or can fail) the request that
 triggered the event - see WebhookExecutorConfig. */
@Component
public class WebhookDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(WebhookDeliveryService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final int MAX_ATTEMPTS = 3;
    private static final long BASE_BACKOFF_MS = 500;

    private final WebhookSubscriptionRepositoryInterface subscriptionRepository;
    private final WebhookDeliveryRepositoryInterface deliveryRepository;
    private final WebhookPayloadFormatter payloadFormatter;
    private final Executor webhookDeliveryExecutor;
    private final RestClient restClient;

    public WebhookDeliveryService(
        WebhookSubscriptionRepositoryInterface subscriptionRepository,
        WebhookDeliveryRepositoryInterface deliveryRepository,
        WebhookPayloadFormatter payloadFormatter,
        @Qualifier("webhookDeliveryExecutor") Executor webhookDeliveryExecutor
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.deliveryRepository = deliveryRepository;
        this.payloadFormatter = payloadFormatter;
        this.webhookDeliveryExecutor = webhookDeliveryExecutor;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5_000);
        requestFactory.setReadTimeout(10_000);
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    public void onTicketCreated(TicketSnapshot ticket) {
        dispatch(WebhookEventType.TICKET_CREATED, new WebhookEventContext(
            WebhookEventType.TICKET_CREATED, ticket.projectId(), ticket.id().value(), ticket.key().toString(),
            ticket.title(), ticket.statusId(), null, null, null, null, Instant.now()
        ));
    }

    public void onTicketStatusChanged(TicketSnapshot ticket, UUID previousStatusId) {
        dispatch(WebhookEventType.TICKET_STATUS_CHANGED, new WebhookEventContext(
            WebhookEventType.TICKET_STATUS_CHANGED, ticket.projectId(), ticket.id().value(), ticket.key().toString(),
            ticket.title(), ticket.statusId(), previousStatusId, null, null, null, Instant.now()
        ));
    }

    public void onTicketFieldChanged(TicketSnapshot ticket, String fieldId) {
        dispatch(WebhookEventType.TICKET_FIELD_CHANGED, new WebhookEventContext(
            WebhookEventType.TICKET_FIELD_CHANGED, ticket.projectId(), ticket.id().value(), ticket.key().toString(),
            ticket.title(), ticket.statusId(), null, fieldId, null, null, Instant.now()
        ));
    }

    public void onCommentAdded(CommentSnapshot comment, TicketSnapshot ticket) {
        dispatch(WebhookEventType.COMMENT_ADDED, new WebhookEventContext(
            WebhookEventType.COMMENT_ADDED, ticket.projectId(), ticket.id().value(), ticket.key().toString(),
            ticket.title(), ticket.statusId(), null, null, comment.body(), null, Instant.now()
        ));
    }

    // Git/VCS events - the referenced ticket's key/title aren't loaded here, so the payload carries
    // ticketId + a ready-made human-readable summary (which WebhookPayloadFormatter uses verbatim
    // for the chat-provider message and includes in the GENERIC envelope).
    public void onVcsCommitPushed(UUID projectId, UUID ticketId, String branchName) {
        dispatchVcs(WebhookEventType.COMMIT_PUSHED, projectId, ticketId,
            "Commit pushed on branch %s (ticket %s)".formatted(branchName, ticketId));
    }

    public void onVcsBranchCreated(UUID projectId, UUID ticketId, String branchName) {
        dispatchVcs(WebhookEventType.BRANCH_CREATED, projectId, ticketId,
            "Branch %s created (ticket %s)".formatted(branchName, ticketId));
    }

    public void onVcsPullRequestOpened(UUID projectId, UUID ticketId, String pullRequestId, String title) {
        dispatchVcs(WebhookEventType.PULL_REQUEST_OPENED, projectId, ticketId,
            "Pull request #%s opened: %s (ticket %s)".formatted(pullRequestId, title, ticketId));
    }

    public void onVcsPullRequestMerged(UUID projectId, UUID ticketId, String pullRequestId, String title) {
        dispatchVcs(WebhookEventType.PULL_REQUEST_MERGED, projectId, ticketId,
            "Pull request #%s merged: %s (ticket %s)".formatted(pullRequestId, title, ticketId));
    }

    public void onVcsPullRequestDeclined(UUID projectId, UUID ticketId, String pullRequestId, String title) {
        dispatchVcs(WebhookEventType.PULL_REQUEST_DECLINED, projectId, ticketId,
            "Pull request #%s declined: %s (ticket %s)".formatted(pullRequestId, title, ticketId));
    }

    private void dispatchVcs(WebhookEventType eventType, UUID projectId, UUID ticketId, String summary) {
        dispatch(eventType, new WebhookEventContext(
            eventType, projectId, ticketId, null, null, null, null, null, null, summary, Instant.now()
        ));
    }

    /** POST .../webhook/{id}/test - fires a synthetic delivery through this same pipeline, targeted
     at exactly one subscription regardless of its eventTypes/enabled flag (the caller already knows
     which subscription they're testing). The frontend only cares whether this call itself
     succeeded in queueing the attempt - the actual delivery result shows up as a new row in the
     delivery log, same as any other delivery. */
    public void deliverTest(WebhookSubscriptionSnapshot subscription) {
        WebhookEventContext context = new WebhookEventContext(
            null, subscription.projectId(), null, null, null, null, null, null, null,
            "This is a test delivery triggered from VantaCore's webhook settings.", Instant.now()
        );

        this.webhookDeliveryExecutor.execute(() -> deliverWithRetry(subscription, "TEST", context));
    }

    private void dispatch(WebhookEventType eventType, WebhookEventContext context) {
        this.webhookDeliveryExecutor.execute(() -> {
            List<WebhookSubscriptionSnapshot> subscriptions =
                this.subscriptionRepository.findAllEnabledByProjectIdAndEventType(context.projectId(), eventType);

            for (WebhookSubscriptionSnapshot subscription : subscriptions) {
                deliverWithRetry(subscription, eventType.name(), context);
            }
        });
    }

    private void deliverWithRetry(WebhookSubscriptionSnapshot subscription, String eventTypeLabel, WebhookEventContext context) {
        String body = subscription.targetType() == WebhookTargetType.GENERIC
            ? this.payloadFormatter.genericBody(eventTypeLabel, context)
            : this.payloadFormatter.providerBody(subscription.targetType(), eventTypeLabel, context);

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            Integer statusCode = null;
            boolean success = false;

            try {
                statusCode = send(subscription, body);
                success = statusCode >= 200 && statusCode < 300;
            } catch (Exception exception) {
                log.warn("Webhook delivery failed (subscription {}, attempt {}): {}", subscription.id(), attempt, exception.getMessage());
            }

            boolean lastAttempt = attempt == MAX_ATTEMPTS;
            WebhookDeliveryStatus status = success ? WebhookDeliveryStatus.SUCCESS : (lastAttempt ? WebhookDeliveryStatus.FAILED : WebhookDeliveryStatus.RETRYING);

            this.deliveryRepository.save(WebhookDeliveryAggregate.newDelivery(
                new WebhookDeliveryId(UUID.randomUUID()), subscription.id().value(), eventTypeLabel, statusCode, status, attempt, Instant.now()
            ));

            if (success) {
                return;
            }

            if (!lastAttempt) {
                sleep(BASE_BACKOFF_MS * (1L << (attempt - 1)));
            }
        }
    }

    private int send(WebhookSubscriptionSnapshot subscription, String body) {
        RestClient.RequestBodySpec request = this.restClient.post()
            .uri(subscription.targetUrl())
            .header("Content-Type", "application/json");

        if (subscription.targetType() == WebhookTargetType.GENERIC) {
            request = request.header("X-VantaCore-Signature", sign(body, subscription.secret()));
        }

        return request.body(body).exchange((req, response) -> response.getStatusCode().value());
    }

    private String sign(String body, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to sign webhook payload", exception);
        }
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }
}
