package vantaCore.application.notification.appliaction.eventHandler;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import vantaCore.application.notification.appliaction.command.createNotification.CreateNotificationCommand;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.event.NewTicketWasCreated;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

// Only listens for NewTicketWasCreated, not TicketWasChanged - editing a ticket (e.g. tweaking its
// description) must not re-notify every assignee on every save.
@Component
public class CreateNotificationWhenNewTicketWasCreated implements EventHandlerInterface<NewTicketWasCreated> {

    private static final String TICKET_ASSIGNED_NOTIFICATION = "TICKET_ASSIGNED";

    private final CommandBusInterface commandBus;

    // @Lazy breaks a genuine construction-time cycle: CommandBus's constructor collects every
    // CommandHandlerInterface bean (incl. UpsertTicketCommandHandler, which needs EventBus), and
    // EventBus's constructor collects every EventHandlerInterface bean (incl. this class) - so eagerly
    // resolving CommandBus here closes the loop. This defers the actual CommandBus lookup to first use
    // (i.e. when a NewTicketWasCreated event is actually handled), by which point the context is up.
    public CreateNotificationWhenNewTicketWasCreated(@Lazy CommandBusInterface commandBus) {
        this.commandBus = commandBus;
    }

    @Override
    public Void handle(NewTicketWasCreated event) {
        TicketSnapshot ticket = event.ticket();

        for (UUID assigneeId : ticket.assigneeIds()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("ticketId", ticket.id().value());
            payload.put("ticketKey", ticket.key().value());
            payload.put("title", ticket.title());
            payload.put("projectId", ticket.projectId());

            dispatch(new CreateNotificationCommand(assigneeId, TICKET_ASSIGNED_NOTIFICATION, payload));
        }

        return null;
    }

    // CommandBusInterface.handle throws a checked Exception (it's normally called from controllers,
    // which already declare `throws Exception`) - EventHandlerInterface.handle doesn't allow that, so
    // it's wrapped once here instead of propagated.
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
