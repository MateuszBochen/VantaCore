package vantaCore.application.file.appliaction.command.uploadTicketAttachment;

import org.springframework.stereotype.Component;
import vantaCore.application.file.appliaction.dto.FileUploadPayload;
import vantaCore.application.file.domain.FileAggregate;
import vantaCore.application.file.domain.policy.FileUploadCheck;
import vantaCore.application.file.domain.policy.FileUploadPolicy;
import vantaCore.application.file.domain.repository.FileAggregateRepositoryInterface;
import vantaCore.application.file.domain.storage.FileStorageInterface;
import vantaCore.application.file.domain.storage.StorageDirectory;
import vantaCore.application.file.domain.vo.FileId;
import vantaCore.application.file.domain.vo.FileOwnerType;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;

@Component
final public class UploadTicketAttachmentCommandHandler implements CommandHandlerInterface<UploadTicketAttachmentCommand> {

    private final FileAggregateRepositoryInterface repository;
    private final FileStorageInterface storage;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final FileUploadPolicy fileUploadPolicy;
    private final CurrentUserProviderInterface currentUserProvider;

    public UploadTicketAttachmentCommandHandler(
        FileAggregateRepositoryInterface repository,
        FileStorageInterface storage,
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        FileUploadPolicy fileUploadPolicy,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.repository = repository;
        this.storage = storage;
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.fileUploadPolicy = fileUploadPolicy;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Void handle(UploadTicketAttachmentCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        TicketId ticketId = new TicketId(command.getTicketId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

        FileUploadPayload payload = command.getPayload();

        this.fileUploadPolicy.check(
            new FileUploadCheck(FileOwnerType.TICKET_ATTACHMENT, payload.contentType(), payload.sizeBytes())
        ).assertAllowed();

        String storageKey = this.storage.store(
            StorageDirectory.ticketAttachment(projectId.value(), ticketId.value()),
            new FileId(command.getAttachmentId()),
            payload.content(),
            payload.originalFilename()
        );
        UserId currentUserId = this.currentUserProvider.getCurrentUserId();

        FileAggregate file = FileAggregate.newFile(
            new FileId(command.getAttachmentId()),
            payload.originalFilename(),
            payload.contentType(),
            payload.sizeBytes(),
            storageKey,
            FileOwnerType.TICKET_ATTACHMENT,
            ticketId.value(),
            currentUserId.value(),
            Instant.now()
        );

        this.repository.save(file);

        return null;
    }
}
