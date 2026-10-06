package vantaCore.application.worklog.appliaction.query.listWorklog;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.worklog.domain.WorklogEntryAggregate;
import vantaCore.application.worklog.domain.WorklogEntrySnapshot;
import vantaCore.application.worklog.domain.repository.WorklogEntryAggregateRepositoryInterface;

import java.util.List;

@Component
final public class ListWorklogQueryHandler implements QueryHandlerInterface<ListWorklogQuery, Collection<WorklogResult>> {

    private final WorklogEntryAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;

    public ListWorklogQueryHandler(
        WorklogEntryAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
    }

    @Override
    public Collection<WorklogResult> handle(ListWorklogQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        TicketId ticketId = new TicketId(query.getTicketId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

        List<Item<WorklogResult>> items = this.repository.findAllByTicketId(ticketId.value()).stream()
            .map(WorklogEntryAggregate::toSnapshot)
            .map(this::toItem)
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }

    private Item<WorklogResult> toItem(WorklogEntrySnapshot snapshot) {
        return Item.fromPayload(snapshot.id().toString(), new WorklogResult(
            snapshot.id().value(),
            snapshot.minutes(),
            snapshot.date(),
            snapshot.note(),
            new WorklogActorResult(snapshot.userId())
        ));
    }
}
