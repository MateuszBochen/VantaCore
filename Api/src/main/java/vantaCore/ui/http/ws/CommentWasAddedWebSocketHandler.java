package vantaCore.ui.http.ws;

import org.springframework.stereotype.Component;
import vantaCore.application.comment.domain.event.CommentWasAdded;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.shared.domain.realtime.RealtimeNotifierInterface;

@Component
public class CommentWasAddedWebSocketHandler implements EventHandlerInterface<CommentWasAdded> {

    private static final String COMMENT_ADDED_EVENT = "COMMENT_ADDED";

    private final RealtimeNotifierInterface realtimeNotifier;

    public CommentWasAddedWebSocketHandler(RealtimeNotifierInterface realtimeNotifier) {
        this.realtimeNotifier = realtimeNotifier;
    }

    @Override
    public Void handle(CommentWasAdded event) {
        this.realtimeNotifier.broadcastAll(COMMENT_ADDED_EVENT, CommentBroadcastResult.from(event.comment()));

        return null;
    }
}
