package vantaCore.application.file.appliaction.command.deletePlatformDocumentationAttachment;

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

@Component
final public class DeletePlatformDocumentationAttachmentCommandHandler implements CommandHandlerInterface<DeletePlatformDocumentationAttachmentCommand> {

    private final FileAggregateRepositoryInterface repository;
    private final FileStorageInterface storage;
    private final ProjectAggregateRepositoryInterface projectRepository;

    public DeletePlatformDocumentationAttachmentCommandHandler(
        FileAggregateRepositoryInterface repository,
        FileStorageInterface storage,
        ProjectAggregateRepositoryInterface projectRepository
    ) {
        this.repository = repository;
        this.storage = storage;
        this.projectRepository = projectRepository;
    }

    @Override
    public Void handle(DeletePlatformDocumentationAttachmentCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        FileId attachmentId = new FileId(command.getAttachmentId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        FileAggregate file = this.repository.findById(attachmentId).orElseThrow(StoredFileNotFoundException::new);
        var snapshot = file.toSnapshot();

        if (snapshot.ownerType() != FileOwnerType.PLATFORM_DOCUMENTATION_ATTACHMENT || !snapshot.ownerId().equals(projectId.value())) {
            throw new StoredFileNotFoundException();
        }

        this.storage.delete(snapshot.storageKey());
        this.repository.deleteById(attachmentId);

        return null;
    }
}
