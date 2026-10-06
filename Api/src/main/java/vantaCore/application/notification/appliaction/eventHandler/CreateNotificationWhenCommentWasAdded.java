package vantaCore.application.notification.appliaction.eventHandler;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import vantaCore.application.comment.domain.CommentSnapshot;
import vantaCore.application.comment.domain.event.CommentWasAdded;
import vantaCore.application.notification.appliaction.command.createNotification.CreateNotificationCommand;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.ticket.domain.TicketSnapshot;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

// Recipients = the ticket's assignees + its author, minus the comment's own author (no point telling
// someone about their own comment). Everything needed is already on the event (see CommentWasAdded) -
// no lookup into the ticket module from here.
@Component
public class CreateNotificationWhenCommentWasAdded implements EventHandlerInterface<CommentWasAdded> {

    private static final String COMMENT_ADDED_NOTIFICATION = "COMMENT_ADDED";

    private final CommandBusInterface commandBus;

    // @Lazy for the same construction-time-cycle reason as CreateNotificationWhenNewTicketWasCreated
    // and PropagateTimeSpentWhenTicketTimeWasLogged.
    public CreateNotificationWhenCommentWasAdded(@Lazy CommandBusInterface commandBus) {
        this.commandBus = commandBus;
    }

    @Override
    public Void handle(CommentWasAdded event) {
        CommentSnapshot comment = event.comment();
        TicketSnapshot ticket = event.ticket();

        Set<UUID> recipients = new HashSet<>(ticket.assigneeIds());

        if (ticket.authorId() != null) {
            recipients.add(ticket.authorId());
        }

        recipients.remove(comment.authorId());

        for (UUID recipientId : recipients) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("commentId", comment.id().value());
            payload.put("ticketId", ticket.id().value());
            payload.put("ticketKey", ticket.key().value());
            payload.put("projectId", ticket.projectId());
            payload.put("body", comment.body());
            payload.put("authorId", comment.authorId());

            dispatch(new CreateNotificationCommand(recipientId, COMMENT_ADDED_NOTIFICATION, payload));
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
