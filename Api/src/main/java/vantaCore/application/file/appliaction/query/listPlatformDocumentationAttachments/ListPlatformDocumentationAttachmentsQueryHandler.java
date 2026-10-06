package vantaCore.application.file.appliaction.query.listPlatformDocumentationAttachments;

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

import java.util.List;
import java.util.UUID;

@Component
final public class ListPlatformDocumentationAttachmentsQueryHandler implements QueryHandlerInterface<ListPlatformDocumentationAttachmentsQuery, Collection<PlatformDocumentationAttachmentResult>> {

    private final FileAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;

    public ListPlatformDocumentationAttachmentsQueryHandler(
        FileAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
    }

    @Override
    public Collection<PlatformDocumentationAttachmentResult> handle(ListPlatformDocumentationAttachmentsQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        List<Item<PlatformDocumentationAttachmentResult>> items = this.repository.findAllByOwner(FileOwnerType.PLATFORM_DOCUMENTATION_ATTACHMENT, projectId.value()).stream()
            .map(FileAggregate::toSnapshot)
            .map(file -> toItem(file, projectId.value()))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }

    private Item<PlatformDocumentationAttachmentResult> toItem(FileSnapshot file, UUID projectId) {
        String url = "/api/project/" + projectId + "/documentation/attachment/" + file.id() + "/download";

        return Item.fromPayload(file.id().toString(), new PlatformDocumentationAttachmentResult(
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
