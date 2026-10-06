package vantaCore.application.file.appliaction.command.uploadSubProjectAttachment;

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
import vantaCore.application.subProject.domain.exception.SubProjectNotFoundException;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface;
import vantaCore.application.subProject.domain.vo.SubProjectId;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;

@Component
final public class UploadSubProjectAttachmentCommandHandler implements CommandHandlerInterface<UploadSubProjectAttachmentCommand> {

    private final FileAggregateRepositoryInterface repository;
    private final FileStorageInterface storage;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final SubProjectRepositoryInterface subProjectRepository;
    private final FileUploadPolicy fileUploadPolicy;
    private final CurrentUserProviderInterface currentUserProvider;

    public UploadSubProjectAttachmentCommandHandler(
        FileAggregateRepositoryInterface repository,
        FileStorageInterface storage,
        ProjectAggregateRepositoryInterface projectRepository,
        SubProjectRepositoryInterface subProjectRepository,
        FileUploadPolicy fileUploadPolicy,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.repository = repository;
        this.storage = storage;
        this.projectRepository = projectRepository;
        this.subProjectRepository = subProjectRepository;
        this.fileUploadPolicy = fileUploadPolicy;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Void handle(UploadSubProjectAttachmentCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        SubProjectId subProjectId = new SubProjectId(command.getSubProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.subProjectRepository.findLatestBySubProjectId(projectId, subProjectId)
            .orElseThrow(SubProjectNotFoundException::new);

        FileUploadPayload payload = command.getPayload();

        this.fileUploadPolicy.check(
            new FileUploadCheck(FileOwnerType.SUB_PROJECT_ATTACHMENT, payload.contentType(), payload.sizeBytes())
        ).assertAllowed();

        String storageKey = this.storage.store(
            StorageDirectory.subProjectAttachment(projectId.value(), subProjectId.value()),
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
            FileOwnerType.SUB_PROJECT_ATTACHMENT,
            subProjectId.value(),
            currentUserId.value(),
            Instant.now()
        );

        this.repository.save(file);

        return null;
    }
}
