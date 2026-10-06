package vantaCore.application.ticket.appliaction.eventHandler;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.ticket.appliaction.command.propagateTimeSpent.PropagateTimeSpentCommand;
import vantaCore.application.worklog.domain.event.TicketTimeWasLogged;

@Component
public class PropagateTimeSpentWhenTicketTimeWasLogged implements EventHandlerInterface<TicketTimeWasLogged> {

    private final CommandBusInterface commandBus;

    // @Lazy for the same reason as CreateNotificationWhenNewTicketWasCreated: CommandBus's
    // constructor collects every CommandHandlerInterface bean (incl. the worklog handlers, which
    // need EventBus), and EventBus's constructor collects every EventHandlerInterface bean (incl.
    // this class) - eagerly resolving CommandBus here would close that loop.
    public PropagateTimeSpentWhenTicketTimeWasLogged(@Lazy CommandBusInterface commandBus) {
        this.commandBus = commandBus;
    }

    @Override
    public Void handle(TicketTimeWasLogged event) {
        dispatch(new PropagateTimeSpentCommand(event.ticketId(), event.deltaMinutes()));

        return null;
    }

    private void dispatch(PropagateTimeSpentCommand command) {
        try {
            this.commandBus.handle(command);
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to propagate ticket time spent", exception);
        }
    }
}
