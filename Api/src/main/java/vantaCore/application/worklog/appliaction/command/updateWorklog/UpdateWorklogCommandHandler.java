package vantaCore.application.worklog.appliaction.command.updateWorklog;

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
import vantaCore.application.worklog.appliaction.dto.WorklogRequest;
import vantaCore.application.worklog.domain.WorklogEntryAggregate;
import vantaCore.application.worklog.domain.WorklogEntrySnapshot;
import vantaCore.application.worklog.domain.event.TicketTimeWasLogged;
import vantaCore.application.worklog.domain.event.WorklogEntryWasChanged;
import vantaCore.application.worklog.domain.repository.WorklogEntryAggregateRepositoryInterface;
import vantaCore.application.worklog.domain.vo.WorklogEntryId;

@Component
final public class UpdateWorklogCommandHandler implements CommandHandlerInterface<UpdateWorklogCommand> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final WorklogEntryAggregateRepositoryInterface repository;
    private final EventBusInterface eventBus;

    public UpdateWorklogCommandHandler(
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
    public Void handle(UpdateWorklogCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        TicketId ticketId = new TicketId(command.getTicketId());
        WorklogEntryId worklogId = new WorklogEntryId(command.getWorklogId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

        WorklogEntryAggregate existing = this.repository.findById(worklogId)
            .orElseThrow(WorklogEntryNotFoundException::new);

        WorklogEntrySnapshot existingSnapshot = existing.toSnapshot();

        // don't distinguish "doesn't exist" from "belongs to a different ticket" - private-ish
        // sub-resource, same reasoning as NotificationController.markAsRead
        if (!existingSnapshot.ticketId().equals(ticketId.value())) {
            throw new WorklogEntryNotFoundException();
        }

        WorklogRequest request = command.getWorklogRequest();
        int deltaMinutes = request.getMinutes() - existingSnapshot.minutes();

        WorklogEntryAggregate updated = existing.changeEntry(request.getMinutes(), request.getDate(), request.getNote());
        this.repository.save(updated);

        this.eventBus.dispatch(new TicketTimeWasLogged(ticketId.value(), deltaMinutes));
        this.eventBus.dispatch(new WorklogEntryWasChanged(updated.toSnapshot()));

        return null;
    }
}
