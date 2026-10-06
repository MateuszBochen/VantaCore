package vantaCore.application.notification.appliaction.command.createNotification;

import org.springframework.stereotype.Component;
import vantaCore.application.notification.appliaction.query.listNotifications.NotificationResult;
import vantaCore.application.notification.appliaction.service.NotificationPreferenceResolver;
import vantaCore.application.notification.domain.NotificationAggregate;
import vantaCore.application.notification.domain.repository.NotificationAggregateRepositoryInterface;
import vantaCore.application.notification.domain.vo.NotificationEventType;
import vantaCore.application.notification.domain.vo.NotificationId;
import vantaCore.application.notification.domain.vo.NotificationMode;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.domain.realtime.RealtimeNotifierInterface;

import java.time.Instant;
import java.util.UUID;

/** The single choke point every notification-creating code path already goes through (every
 CreateNotificationCommand dispatch, from any event handler) - see the "enforced at creation time,
 not filtered client-side" ADR on the Notification Tuning sub-project. MUTED skips creation
 entirely; DIGEST still creates the row (so GET /api/notification already shows it) but skips the
 immediate WebSocket push, leaving it for NotificationDigestFlushJob; REALTIME is today's unchanged
 create+push behavior. */
@Component
final public class CreateNotificationCommandHandler implements CommandHandlerInterface<CreateNotificationCommand> {

    private static final String NOTIFICATION_CREATED_EVENT = "NOTIFICATION_CREATED";
    private static final String PROJECT_ID_PAYLOAD_KEY = "projectId";

    private final NotificationAggregateRepositoryInterface repository;
    private final RealtimeNotifierInterface realtimeNotifier;
    private final NotificationPreferenceResolver preferenceResolver;

    public CreateNotificationCommandHandler(
        NotificationAggregateRepositoryInterface repository,
        RealtimeNotifierInterface realtimeNotifier,
        NotificationPreferenceResolver preferenceResolver
    ) {
        this.repository = repository;
        this.realtimeNotifier = realtimeNotifier;
        this.preferenceResolver = preferenceResolver;
    }

    @Override
    public Void handle(CreateNotificationCommand command) {
        UUID projectId = projectIdOf(command);
        NotificationEventType eventType = NotificationEventType.fromTypeStringOrNull(command.getType());

        NotificationMode mode = this.preferenceResolver.resolve(command.getUserId(), projectId, eventType);

        if (mode == NotificationMode.MUTED) {
            return null;
        }

        NotificationAggregate notification = new NotificationAggregate(
            NotificationId.create(),
            command.getUserId(),
            command.getType(),
            command.getPayload(),
            false,
            mode == NotificationMode.DIGEST,
            Instant.now()
        );

        this.repository.save(notification);

        if (mode == NotificationMode.REALTIME) {
            NotificationResult result = new NotificationResult(
                notification.getId().value(),
                notification.getType(),
                notification.getPayload(),
                notification.isRead(),
                notification.getCreatedAt()
            );

            this.realtimeNotifier.notifyUser(command.getUserId(), NOTIFICATION_CREATED_EVENT, result);
        }

        return null;
    }

    // Every notification-creating event handler already puts projectId into the payload (needed
    // for the frontend to link back to the ticket/project) - reused here rather than adding a
    // dedicated field to CreateNotificationCommand, since every existing caller already supplies it
    // this way.
    private UUID projectIdOf(CreateNotificationCommand command) {
        Object value = command.getPayload() == null ? null : command.getPayload().get(PROJECT_ID_PAYLOAD_KEY);
        return value instanceof UUID uuid ? uuid : null;
    }
}
