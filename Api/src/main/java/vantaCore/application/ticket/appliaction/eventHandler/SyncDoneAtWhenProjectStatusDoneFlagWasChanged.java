package vantaCore.application.ticket.appliaction.eventHandler;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.event.ProjectStatusDoneFlagWasChanged;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.ticket.appliaction.command.syncDoneAt.SyncDoneAtForStatusesCommand;

/** Project settings changed which statuses count as done - tickets' doneAt follows (the "Created vs
 done" stats chart reads it). */
@Component
public class SyncDoneAtWhenProjectStatusDoneFlagWasChanged implements EventHandlerInterface<ProjectStatusDoneFlagWasChanged> {

    private final CommandBusInterface commandBus;

    // @Lazy for the same construction-time-cycle reason as PropagateTimeSpentWhenTicketTimeWasLogged.
    public SyncDoneAtWhenProjectStatusDoneFlagWasChanged(@Lazy CommandBusInterface commandBus) {
        this.commandBus = commandBus;
    }

    @Override
    public Void handle(ProjectStatusDoneFlagWasChanged event) {
        try {
            this.commandBus.handle(new SyncDoneAtForStatusesCommand(
                event.projectId(), event.becameDoneStatusIds(), event.becameNotDoneStatusIds()
            ));
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to sync ticket doneAt", exception);
        }

        return null;
    }
}
