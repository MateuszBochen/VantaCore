package vantaCore.ui.http.ws;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.shared.domain.realtime.RealtimeNotifierInterface;
import vantaCore.application.ticket.appliaction.service.TicketRelationEnricher;
import vantaCore.application.ticket.domain.event.TicketWasChanged;

@Component
public class TicketWasChangedWebSocketHandler implements EventHandlerInterface<TicketWasChanged> {

    private static final String TICKET_CHANGED_EVENT = "TICKET_CHANGED";

    private final RealtimeNotifierInterface realtimeNotifier;
    private final TicketRelationEnricher relationEnricher;

    public TicketWasChangedWebSocketHandler(RealtimeNotifierInterface realtimeNotifier, TicketRelationEnricher relationEnricher) {
        this.realtimeNotifier = realtimeNotifier;
        this.relationEnricher = relationEnricher;
    }

    @Override
    public Void handle(TicketWasChanged event) {
        TicketBroadcastResult result = TicketBroadcastResult.from(
            event.ticket(),
            this.relationEnricher.enrich(event.ticket().relatedTickets())
        );

        this.realtimeNotifier.broadcastAll(TICKET_CHANGED_EVENT, result);

        return null;
    }
}
