package vantaCore.application.file.appliaction.command.deleteTicketAttachment;

import org.springframework.stereotype.Component;
import vantaCore.application.file.domain.FileAggregate;
import vantaCore.application.file.domain.repository.FileAggregateRepositoryInterface;
import vantaCore.application.file.domain.storage.FileStorageInterface;
import vantaCore.application.file.domain.vo.FileId;
import vantaCore.application.file.domain.vo.FileOwnerType;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.StoredFileNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

@Component
final public class DeleteTicketAttachmentCommandHandler implements CommandHandlerInterface<DeleteTicketAttachmentCommand> {

    private final FileAggregateRepositoryInterface repository;
    private final FileStorageInterface storage;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;

    public DeleteTicketAttachmentCommandHandler(
        FileAggregateRepositoryInterface repository,
        FileStorageInterface storage,
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository
    ) {
        this.repository = repository;
        this.storage = storage;
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
    }

    @Override
    public Void handle(DeleteTicketAttachmentCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        TicketId ticketId = new TicketId(command.getTicketId());
        FileId attachmentId = new FileId(command.getAttachmentId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

        FileAggregate file = this.repository.findById(attachmentId).orElseThrow(StoredFileNotFoundException::new);
        var snapshot = file.toSnapshot();

        if (snapshot.ownerType() != FileOwnerType.TICKET_ATTACHMENT || !snapshot.ownerId().equals(ticketId.value())) {
            throw new StoredFileNotFoundException();
        }

        this.storage.delete(snapshot.storageKey());
        this.repository.deleteById(attachmentId);

        return null;
    }
}
