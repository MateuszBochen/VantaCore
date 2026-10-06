package vantaCore.application.file.appliaction.query.listTicketAttachments;

import org.springframework.stereotype.Component;
import vantaCore.application.file.domain.FileAggregate;
import vantaCore.application.file.domain.FileSnapshot;
import vantaCore.application.file.domain.repository.FileAggregateRepositoryInterface;
import vantaCore.application.file.domain.vo.FileOwnerType;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.util.List;
import java.util.UUID;

@Component
final public class ListTicketAttachmentsQueryHandler implements QueryHandlerInterface<ListTicketAttachmentsQuery, Collection<TicketAttachmentResult>> {

    private final FileAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;

    public ListTicketAttachmentsQueryHandler(
        FileAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
    }

    @Override
    public Collection<TicketAttachmentResult> handle(ListTicketAttachmentsQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        TicketId ticketId = new TicketId(query.getTicketId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

        List<Item<TicketAttachmentResult>> items = this.repository.findAllByOwner(FileOwnerType.TICKET_ATTACHMENT, ticketId.value()).stream()
            .map(FileAggregate::toSnapshot)
            .map(file -> toItem(file, projectId.value(), ticketId.value()))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }

    private Item<TicketAttachmentResult> toItem(FileSnapshot file, UUID projectId, UUID ticketId) {
        String url = "/api/project/" + projectId + "/ticket/" + ticketId + "/attachment/" + file.id() + "/download";

        return Item.fromPayload(file.id().toString(), new TicketAttachmentResult(
            file.id().value(),
            file.originalFilename(),
            file.contentType(),
            file.sizeBytes(),
            file.uploadedByUserId(),
            file.uploadedAt(),
            url
        ));
    }
}
