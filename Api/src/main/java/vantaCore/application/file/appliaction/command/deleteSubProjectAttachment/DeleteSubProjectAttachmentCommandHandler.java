package vantaCore.application.file.appliaction.command.deleteSubProjectAttachment;

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
import vantaCore.application.subProject.domain.exception.SubProjectNotFoundException;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface;
import vantaCore.application.subProject.domain.vo.SubProjectId;

@Component
final public class DeleteSubProjectAttachmentCommandHandler implements CommandHandlerInterface<DeleteSubProjectAttachmentCommand> {

    private final FileAggregateRepositoryInterface repository;
    private final FileStorageInterface storage;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final SubProjectRepositoryInterface subProjectRepository;

    public DeleteSubProjectAttachmentCommandHandler(
        FileAggregateRepositoryInterface repository,
        FileStorageInterface storage,
        ProjectAggregateRepositoryInterface projectRepository,
        SubProjectRepositoryInterface subProjectRepository
    ) {
        this.repository = repository;
        this.storage = storage;
        this.projectRepository = projectRepository;
        this.subProjectRepository = subProjectRepository;
    }

    @Override
    public Void handle(DeleteSubProjectAttachmentCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        SubProjectId subProjectId = new SubProjectId(command.getSubProjectId());
        FileId attachmentId = new FileId(command.getAttachmentId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.subProjectRepository.findLatestBySubProjectId(projectId, subProjectId)
            .orElseThrow(SubProjectNotFoundException::new);

        FileAggregate file = this.repository.findById(attachmentId).orElseThrow(StoredFileNotFoundException::new);
        var snapshot = file.toSnapshot();

        if (snapshot.ownerType() != FileOwnerType.SUB_PROJECT_ATTACHMENT || !snapshot.ownerId().equals(subProjectId.value())) {
            throw new StoredFileNotFoundException();
        }

        this.storage.delete(snapshot.storageKey());
        this.repository.deleteById(attachmentId);

        return null;
    }
}
