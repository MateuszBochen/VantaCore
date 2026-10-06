package vantaCore.application.worklog.appliaction.command.deleteWorklog;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.event.EventBusInterface;
import vantaCore.application.shared.application.exception.WorklogEntryNotFoundException;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.worklog.domain.WorklogEntrySnapshot;
import vantaCore.application.worklog.domain.event.TicketTimeWasLogged;
import vantaCore.application.worklog.domain.repository.WorklogEntryAggregateRepositoryInterface;
import vantaCore.application.worklog.domain.vo.WorklogEntryId;

@Component
final public class DeleteWorklogCommandHandler implements CommandHandlerInterface<DeleteWorklogCommand> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final WorklogEntryAggregateRepositoryInterface repository;
    private final EventBusInterface eventBus;

    public DeleteWorklogCommandHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        WorklogEntryAggregateRepositoryInterface repository,
        EventBusInterface eventBus
    ) {
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.repository = repository;
        this.eventBus = eventBus;
    }

    @Override
    public Void handle(DeleteWorklogCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        TicketId ticketId = new TicketId(command.getTicketId());
        WorklogEntryId worklogId = new WorklogEntryId(command.getWorklogId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

        WorklogEntrySnapshot existing = this.repository.findById(worklogId)
            .orElseThrow(WorklogEntryNotFoundException::new)
            .toSnapshot();

        if (!existing.ticketId().equals(ticketId.value())) {
            throw new WorklogEntryNotFoundException();
        }

        this.repository.deleteById(worklogId);
        this.eventBus.dispatch(new TicketTimeWasLogged(ticketId.value(), -existing.minutes()));

        return null;
    }
}
