package vantaCore.application.ticket.appliaction.query.getPreviousTicketVersion;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketVersionNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.domain.history.TicketHistoryEntrySnapshot;
import vantaCore.application.ticket.domain.history.TicketHistoryEntryAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.history.TicketHistorySnapshot;

@Component
final public class GetPreviousTicketVersionQueryHandler implements QueryHandlerInterface<GetPreviousTicketVersionQuery, Item<TicketHistoryResult>> {

    private final TicketHistoryEntryAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;

    public GetPreviousTicketVersionQueryHandler(
        TicketHistoryEntryAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
    }

    @Override
    public Item<TicketHistoryResult> handle(GetPreviousTicketVersionQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        TicketHistoryEntrySnapshot entry = this.repository.findVersionBefore(query.getTicketId(), query.getBefore())
            .orElseThrow(TicketVersionNotFoundException::new)
            .toSnapshot();

        TicketHistorySnapshot ticket = entry.ticket();

        TicketHistoryResult result = new TicketHistoryResult(
            entry.id(),
            entry.ticketId(),
            ticket.subProjectId(),
            ticket.issueTypeId(),
            ticket.statusId(),
            ticket.parentId(),
            ticket.title(),
            ticket.description(),
            ticket.priority(),
            ticket.estimate(),
            ticket.assigneeIds(),
            ticket.flagIds(),
            ticket.tags(),
            ticket.customFields(),
            ticket.relatedTickets(),
            entry.changedByUserId(),
            entry.changedByEmail(),
            entry.changedAt()
        );

        return Item.fromPayload(entry.id().toString(), result);
    }
}
