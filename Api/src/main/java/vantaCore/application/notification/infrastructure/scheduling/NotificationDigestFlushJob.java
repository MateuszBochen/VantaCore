package vantaCore.application.notification.infrastructure.scheduling;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vantaCore.application.notification.appliaction.query.listNotifications.NotificationResult;
import vantaCore.application.notification.domain.NotificationAggregate;
import vantaCore.application.notification.domain.repository.NotificationAggregateRepositoryInterface;
import vantaCore.application.shared.domain.realtime.RealtimeNotifierInterface;

import java.util.List;
import java.util.UUID;

/** Periodic flush for DIGEST-mode notifications - see the "enforced at creation time" ADR on the
 Notification Tuning sub-project. Delivery beyond this app's own WebSocket push (email/Slack) is
 explicitly out of scope for this sub-project ("this sub-project only decides *what* gets grouped,
 not how it's mailed out") - one batched NOTIFICATION_DIGEST push per user, per run, is this app's
 own existing in-app delivery mechanism, just delayed and grouped instead of one-by-one. A future
 Integrations & Webhooks sub-project owns actually mailing/Slacking a digest out; nothing here
 precludes that from reading the same pendingDigest-flagged rows before they're flushed. */
@Component
public class NotificationDigestFlushJob {

    private static final String NOTIFICATION_DIGEST_EVENT = "NOTIFICATION_DIGEST";

    private final NotificationAggregateRepositoryInterface repository;
    private final RealtimeNotifierInterface realtimeNotifier;

    public NotificationDigestFlushJob(
        NotificationAggregateRepositoryInterface repository,
        RealtimeNotifierInterface realtimeNotifier
    ) {
        this.repository = repository;
        this.realtimeNotifier = realtimeNotifier;
    }

    @Scheduled(fixedRateString = "${app.notification.digest-flush-interval-ms:900000}")
    public void flush() {
        for (UUID userId : this.repository.findDistinctUserIdsWithPendingDigest()) {
            flushForUser(userId);
        }
    }

    private void flushForUser(UUID userId) {
        List<NotificationAggregate> pending = this.repository.findAllByUserIdAndPendingDigestTrue(userId);
        if (pending.isEmpty()) {
            return;
        }

        List<NotificationResult> batch = pending.stream().map(this::toResult).toList();

        for (NotificationAggregate notification : pending) {
            this.repository.save(notification.markDigestFlushed());
        }

        this.realtimeNotifier.notifyUser(userId, NOTIFICATION_DIGEST_EVENT, batch);
    }

    private NotificationResult toResult(NotificationAggregate notification) {
        return new NotificationResult(
            notification.getId().value(),
            notification.getType(),
            notification.getPayload(),
            notification.isRead(),
            notification.getCreatedAt()
        );
    }
}
