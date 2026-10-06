package vantaCore.application.file.appliaction.query.listSubProjectAttachments;

import org.springframework.stereotype.Component;
import vantaCore.application.file.domain.FileAggregate;
import vantaCore.application.file.domain.FileSnapshot;
import vantaCore.application.file.domain.repository.FileAggregateRepositoryInterface;
import vantaCore.application.file.domain.vo.FileOwnerType;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.subProject.domain.exception.SubProjectNotFoundException;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface;
import vantaCore.application.subProject.domain.vo.SubProjectId;

import java.util.List;
import java.util.UUID;

@Component
final public class ListSubProjectAttachmentsQueryHandler implements QueryHandlerInterface<ListSubProjectAttachmentsQuery, Collection<SubProjectAttachmentResult>> {

    private final FileAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final SubProjectRepositoryInterface subProjectRepository;

    public ListSubProjectAttachmentsQueryHandler(
        FileAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        SubProjectRepositoryInterface subProjectRepository
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.subProjectRepository = subProjectRepository;
    }

    @Override
    public Collection<SubProjectAttachmentResult> handle(ListSubProjectAttachmentsQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        SubProjectId subProjectId = new SubProjectId(query.getSubProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.subProjectRepository.findLatestBySubProjectId(projectId, subProjectId)
            .orElseThrow(SubProjectNotFoundException::new);

        List<Item<SubProjectAttachmentResult>> items = this.repository.findAllByOwner(FileOwnerType.SUB_PROJECT_ATTACHMENT, subProjectId.value()).stream()
            .map(FileAggregate::toSnapshot)
            .map(file -> toItem(file, projectId.value(), subProjectId.value()))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }

    private Item<SubProjectAttachmentResult> toItem(FileSnapshot file, UUID projectId, UUID subProjectId) {
        String url = "/api/project/" + projectId + "/sub-project/" + subProjectId + "/attachment/" + file.id() + "/download";

        return Item.fromPayload(file.id().toString(), new SubProjectAttachmentResult(
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
