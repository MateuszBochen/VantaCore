package vantaCore.ui.http.ws;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.shared.domain.realtime.RealtimeNotifierInterface;
import vantaCore.application.worklog.domain.event.WorklogEntryWasChanged;

@Component
public class WorklogEntryWasChangedWebSocketHandler implements EventHandlerInterface<WorklogEntryWasChanged> {

    private static final String WORKLOG_CHANGED_EVENT = "WORKLOG_CHANGED";

    private final RealtimeNotifierInterface realtimeNotifier;

    public WorklogEntryWasChangedWebSocketHandler(RealtimeNotifierInterface realtimeNotifier) {
        this.realtimeNotifier = realtimeNotifier;
    }

    @Override
    public Void handle(WorklogEntryWasChanged event) {
        this.realtimeNotifier.broadcastAll(WORKLOG_CHANGED_EVENT, WorklogBroadcastResult.from(event.entry()));

        return null;
    }
}
