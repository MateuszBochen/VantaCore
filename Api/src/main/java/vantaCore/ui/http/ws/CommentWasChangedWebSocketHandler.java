package vantaCore.ui.http.ws;

import org.springframework.stereotype.Component;
import vantaCore.application.comment.domain.event.CommentWasChanged;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.shared.domain.realtime.RealtimeNotifierInterface;

@Component
public class CommentWasChangedWebSocketHandler implements EventHandlerInterface<CommentWasChanged> {

    private static final String COMMENT_CHANGED_EVENT = "COMMENT_CHANGED";

    private final RealtimeNotifierInterface realtimeNotifier;

    public CommentWasChangedWebSocketHandler(RealtimeNotifierInterface realtimeNotifier) {
        this.realtimeNotifier = realtimeNotifier;
    }

    @Override
    public Void handle(CommentWasChanged event) {
        this.realtimeNotifier.broadcastAll(COMMENT_CHANGED_EVENT, CommentBroadcastResult.from(event.comment()));

        return null;
    }
}
