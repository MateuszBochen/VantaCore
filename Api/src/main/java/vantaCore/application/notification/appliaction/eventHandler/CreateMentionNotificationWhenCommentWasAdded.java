package vantaCore.application.notification.appliaction.eventHandler;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import vantaCore.application.comment.domain.CommentSnapshot;
import vantaCore.application.comment.domain.event.CommentWasAdded;
import vantaCore.application.notification.appliaction.command.createNotification.CreateNotificationCommand;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.shared.application.mention.MentionParser;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

// Separate from CreateNotificationWhenCommentWasAdded (assignee/author notifications) - a mention
// is a distinct reason to notify someone, so it's its own notification even if that person is also
// an assignee and already got a COMMENT_ADDED one for the same comment. Self-mentions notify too
// (deliberately not filtered out) - handy for someone bookmarking their own comment as a reminder.
@Component
public class CreateMentionNotificationWhenCommentWasAdded implements EventHandlerInterface<CommentWasAdded> {

    private static final String MENTIONED_IN_COMMENT_NOTIFICATION = "MENTIONED_IN_COMMENT";

    private final CommandBusInterface commandBus;
    private final MentionParser mentionParser;
    private final UserAggregateRepositoryInterface userRepository;

    // @Lazy for the same construction-time-cycle reason as CreateNotificationWhenCommentWasAdded.
    public CreateMentionNotificationWhenCommentWasAdded(
        @Lazy CommandBusInterface commandBus,
        MentionParser mentionParser,
        UserAggregateRepositoryInterface userRepository
    ) {
        this.commandBus = commandBus;
        this.mentionParser = mentionParser;
        this.userRepository = userRepository;
    }

    @Override
    public Void handle(CommentWasAdded event) {
        CommentSnapshot comment = event.comment();
        TicketSnapshot ticket = event.ticket();

        Set<UUID> mentionedUserIds = this.mentionParser.parseMentionedUserIds(comment.body());

        if (mentionedUserIds.isEmpty()) {
            return null;
        }

        // Garbage/deleted-user ids can end up in free text - only notify ids that resolve to a
        // real user.
        for (UUID recipientId : this.userRepository.findExistingIds(mentionedUserIds)) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("commentId", comment.id().value());
            payload.put("ticketId", ticket.id().value());
            payload.put("ticketKey", ticket.key().value());
            payload.put("projectId", ticket.projectId());
            payload.put("body", comment.body());
            payload.put("mentionedByUserId", comment.authorId());

            dispatch(new CreateNotificationCommand(recipientId, MENTIONED_IN_COMMENT_NOTIFICATION, payload));
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
