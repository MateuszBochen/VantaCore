package vantaCore.ui.http.ws;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.shared.domain.realtime.RealtimeNotifierInterface;
import vantaCore.application.ticket.domain.event.TicketWasDeleted;

@Component
public class TicketWasDeletedWebSocketHandler implements EventHandlerInterface<TicketWasDeleted> {

    private static final String TICKET_DELETED_EVENT = "TICKET_DELETED";

    private final RealtimeNotifierInterface realtimeNotifier;

    public TicketWasDeletedWebSocketHandler(RealtimeNotifierInterface realtimeNotifier) {
        this.realtimeNotifier = realtimeNotifier;
    }

    @Override
    public Void handle(TicketWasDeleted event) {
        // The event's own shape (ticketId/projectId/ticketKey) is already exactly what the
        // frontend needs to remove the ticket from its UI - no separate broadcast-result type
        // needed, same precedent as CommentWasDeletedWebSocketHandler.
        this.realtimeNotifier.broadcastAll(TICKET_DELETED_EVENT, event);

        return null;
    }
}
