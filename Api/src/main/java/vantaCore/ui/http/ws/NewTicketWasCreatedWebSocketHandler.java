package vantaCore.ui.http.ws;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.shared.domain.realtime.RealtimeNotifierInterface;
import vantaCore.application.ticket.appliaction.service.TicketRelationEnricher;
import vantaCore.application.ticket.domain.event.NewTicketWasCreated;

@Component
public class NewTicketWasCreatedWebSocketHandler implements EventHandlerInterface<NewTicketWasCreated> {

    private static final String TICKET_CREATED_EVENT = "TICKET_CREATED";

    private final RealtimeNotifierInterface realtimeNotifier;
    private final TicketRelationEnricher relationEnricher;

    public NewTicketWasCreatedWebSocketHandler(RealtimeNotifierInterface realtimeNotifier, TicketRelationEnricher relationEnricher) {
        this.realtimeNotifier = realtimeNotifier;
        this.relationEnricher = relationEnricher;
    }

    @Override
    public Void handle(NewTicketWasCreated event) {
        TicketBroadcastResult result = TicketBroadcastResult.from(
            event.ticket(),
            this.relationEnricher.enrich(event.ticket().relatedTickets())
        );

        this.realtimeNotifier.broadcastAll(TICKET_CREATED_EVENT, result);

        return null;
    }
}
