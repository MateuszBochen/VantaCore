package vantaCore.application.worklog.appliaction.command.logWorklog;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.event.EventBusInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.user.domain.vo.UserId;
import vantaCore.application.worklog.appliaction.dto.WorklogRequest;
import vantaCore.application.worklog.domain.WorklogEntryAggregate;
import vantaCore.application.worklog.domain.event.TicketTimeWasLogged;
import vantaCore.application.worklog.domain.event.WorklogEntryWasChanged;
import vantaCore.application.worklog.domain.repository.WorklogEntryAggregateRepositoryInterface;
import vantaCore.application.worklog.domain.vo.WorklogEntryId;

import java.time.Instant;

@Component
final public class LogWorklogCommandHandler implements CommandHandlerInterface<LogWorklogCommand> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final WorklogEntryAggregateRepositoryInterface repository;
    private final CurrentUserProviderInterface currentUserProvider;
    private final EventBusInterface eventBus;

    public LogWorklogCommandHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        WorklogEntryAggregateRepositoryInterface repository,
        CurrentUserProviderInterface currentUserProvider,
        EventBusInterface eventBus
    ) {
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
        this.eventBus = eventBus;
    }

    @Override
    public Void handle(LogWorklogCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        TicketId ticketId = new TicketId(command.getTicketId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

        UserId currentUserId = this.currentUserProvider.getCurrentUserId();
        WorklogRequest request = command.getWorklogRequest();

        WorklogEntryAggregate entry = WorklogEntryAggregate.newEntry(
            WorklogEntryId.create(),
            ticketId.value(),
            currentUserId.value(),
            request.getMinutes(),
            request.getDate(),
            request.getNote(),
            Instant.now()
        );

        this.repository.save(entry);
        this.eventBus.dispatch(new TicketTimeWasLogged(ticketId.value(), request.getMinutes()));
        this.eventBus.dispatch(new WorklogEntryWasChanged(entry.toSnapshot()));

        return null;
    }
}
