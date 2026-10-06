package vantaCore.ui.http.ws;

import org.springframework.stereotype.Component;
import vantaCore.application.comment.domain.event.CommentWasDeleted;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.shared.domain.realtime.RealtimeNotifierInterface;

@Component
public class CommentWasDeletedWebSocketHandler implements EventHandlerInterface<CommentWasDeleted> {

    private static final String COMMENT_DELETED_EVENT = "COMMENT_DELETED";

    private final RealtimeNotifierInterface realtimeNotifier;

    public CommentWasDeletedWebSocketHandler(RealtimeNotifierInterface realtimeNotifier) {
        this.realtimeNotifier = realtimeNotifier;
    }

    @Override
    public Void handle(CommentWasDeleted event) {
        // the event's own shape (ticketId + commentId) is already exactly what the frontend needs to
        // remove the comment from its UI - no separate broadcast-result type needed.
        this.realtimeNotifier.broadcastAll(COMMENT_DELETED_EVENT, event);

        return null;
    }
}
