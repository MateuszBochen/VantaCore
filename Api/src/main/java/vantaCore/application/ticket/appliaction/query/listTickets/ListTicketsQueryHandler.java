package vantaCore.application.ticket.appliaction.query.listTickets;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.appliaction.query.TicketResultAssembler;
import vantaCore.application.ticket.appliaction.query.getTicket.GetTicketResult;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface.TicketPage;

import java.util.List;

@Component
final public class ListTicketsQueryHandler implements QueryHandlerInterface<ListTicketsQuery, Collection<GetTicketResult>> {

    private final TicketAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketResultAssembler resultAssembler;

    public ListTicketsQueryHandler(
        TicketAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        TicketResultAssembler resultAssembler
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.resultAssembler = resultAssembler;
    }

    @Override
    public Collection<GetTicketResult> handle(ListTicketsQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());

        ProjectAggregate project = this.projectRepository.findById(projectId)
            .orElseThrow(ProjectNotFoundException::new);

        TicketPage page = this.repository.findAllByProjectId(
            projectId.value(),
            query.getParentId(),
            query.getPage(),
            query.getLimit()
        );

        List<Item<GetTicketResult>> items = page.items().stream()
            .map(ticket -> this.resultAssembler.toResult(ticket, project))
            .map(result -> Item.fromPayload(result.id().toString(), result))
            .toList();

        return new Collection<>(query.getPage(), query.getLimit(), page.total(), items);
    }
}
