package vantaCore.application.ticket.appliaction.command.syncDoneAt;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;

/** Brings tickets' doneAt in line with a status whose isDone flag was flipped in project settings -
 see TicketAggregateRepositoryInterface.markDoneAtForStatuses for the rule. Doesn't touch changedAt
 or write ticket history: no ticket was edited, the project's definition of "done" was. */
@Component
final public class SyncDoneAtForStatusesCommandHandler implements CommandHandlerInterface<SyncDoneAtForStatusesCommand> {

    private final TicketAggregateRepositoryInterface repository;

    public SyncDoneAtForStatusesCommandHandler(TicketAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Void handle(SyncDoneAtForStatusesCommand command) {
        this.repository.markDoneAtForStatuses(command.getProjectId(), command.getBecameDoneStatusIds());
        this.repository.clearDoneAtForStatuses(command.getProjectId(), command.getBecameNotDoneStatusIds());

        return null;
    }
}
