package vantaCore.application.documentation.platform.appliaction.query.getPreviousPlatformDocumentationVersion;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.platform.appliaction.query.PlatformDocumentationResultAssembler;
import vantaCore.application.documentation.platform.appliaction.query.result.PlatformDocumentationResult;
import vantaCore.application.documentation.platform.domain.PlatformDocumentationAggregate;
import vantaCore.application.documentation.platform.domain.exception.PlatformDocumentationVersionNotFoundException;
import vantaCore.application.documentation.platform.domain.repository.PlatformDocumentationRepositoryInterface;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

@Component
final public class GetPreviousPlatformDocumentationVersionQueryHandler
    implements QueryHandlerInterface<GetPreviousPlatformDocumentationVersionQuery, Item<PlatformDocumentationResult>> {

    private final PlatformDocumentationRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final PlatformDocumentationResultAssembler resultAssembler;

    public GetPreviousPlatformDocumentationVersionQueryHandler(
        PlatformDocumentationRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        PlatformDocumentationResultAssembler resultAssembler
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.resultAssembler = resultAssembler;
    }

    @Override
    public Item<PlatformDocumentationResult> handle(GetPreviousPlatformDocumentationVersionQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        PlatformDocumentationAggregate version = this.repository.findVersionBefore(projectId, query.getBefore())
            .orElseThrow(PlatformDocumentationVersionNotFoundException::new);

        return Item.fromPayload(version.getVersionId().toString(), this.resultAssembler.toResult(version));
    }
}
