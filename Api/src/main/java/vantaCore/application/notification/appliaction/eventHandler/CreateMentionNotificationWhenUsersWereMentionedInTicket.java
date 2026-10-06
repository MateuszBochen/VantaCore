package vantaCore.application.notification.appliaction.eventHandler;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import vantaCore.application.notification.appliaction.command.createNotification.CreateNotificationCommand;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.event.UsersWereMentionedInTicket;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

// UsersWereMentionedInTicket is only ever dispatched for newly-added mentions (see
// UpsertTicketCommandHandler.notifyNewlyMentionedUsers) - no further diffing needed here.
@Component
public class CreateMentionNotificationWhenUsersWereMentionedInTicket implements EventHandlerInterface<UsersWereMentionedInTicket> {

    private static final String MENTIONED_IN_TICKET_NOTIFICATION = "MENTIONED_IN_TICKET";

    private final CommandBusInterface commandBus;
    private final UserAggregateRepositoryInterface userRepository;

    // @Lazy for the same construction-time-cycle reason as CreateNotificationWhenNewTicketWasCreated.
    public CreateMentionNotificationWhenUsersWereMentionedInTicket(
        @Lazy CommandBusInterface commandBus,
        UserAggregateRepositoryInterface userRepository
    ) {
        this.commandBus = commandBus;
        this.userRepository = userRepository;
    }

    @Override
    public Void handle(UsersWereMentionedInTicket event) {
        TicketSnapshot ticket = event.ticket();
        UUID mentionedByUserId = event.mentionedByUserId();

        // Garbage/deleted-user ids can end up in free text - only notify ids that resolve to a
        // real user.
        for (UUID recipientId : this.userRepository.findExistingIds(event.mentionedUserIds())) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("ticketId", ticket.id().value());
            payload.put("ticketKey", ticket.key().value());
            payload.put("projectId", ticket.projectId());
            payload.put("title", ticket.title());
            payload.put("mentionedByUserId", mentionedByUserId);

            dispatch(new CreateNotificationCommand(recipientId, MENTIONED_IN_TICKET_NOTIFICATION, payload));
        }

        return null;
    }

    private void dispatch(CreateNotificationCommand command) {
        try {
            this.commandBus.handle(command);
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to create notification", exception);
        }
    }
}
