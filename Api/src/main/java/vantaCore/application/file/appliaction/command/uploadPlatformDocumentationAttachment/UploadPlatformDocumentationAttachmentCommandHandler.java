package vantaCore.application.file.appliaction.command.uploadPlatformDocumentationAttachment;

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
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;

@Component
final public class UploadPlatformDocumentationAttachmentCommandHandler implements CommandHandlerInterface<UploadPlatformDocumentationAttachmentCommand> {

    private final FileAggregateRepositoryInterface repository;
    private final FileStorageInterface storage;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final FileUploadPolicy fileUploadPolicy;
    private final CurrentUserProviderInterface currentUserProvider;

    public UploadPlatformDocumentationAttachmentCommandHandler(
        FileAggregateRepositoryInterface repository,
        FileStorageInterface storage,
        ProjectAggregateRepositoryInterface projectRepository,
        FileUploadPolicy fileUploadPolicy,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.repository = repository;
        this.storage = storage;
        this.projectRepository = projectRepository;
        this.fileUploadPolicy = fileUploadPolicy;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Void handle(UploadPlatformDocumentationAttachmentCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        FileUploadPayload payload = command.getPayload();

        this.fileUploadPolicy.check(
            new FileUploadCheck(FileOwnerType.PLATFORM_DOCUMENTATION_ATTACHMENT, payload.contentType(), payload.sizeBytes())
        ).assertAllowed();

        String storageKey = this.storage.store(
            StorageDirectory.platformDocumentationAttachment(projectId.value()),
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
            FileOwnerType.PLATFORM_DOCUMENTATION_ATTACHMENT,
            projectId.value(),
            currentUserId.value(),
            Instant.now()
        );

        this.repository.save(file);

        return null;
    }
}
