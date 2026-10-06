package vantaCore.application.documentation.platform.appliaction.query.getPlatformDocumentation;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.platform.appliaction.query.PlatformDocumentationResultAssembler;
import vantaCore.application.documentation.platform.appliaction.query.result.PlatformDocumentationResult;
import vantaCore.application.documentation.platform.domain.PlatformDocumentationAggregate;
import vantaCore.application.documentation.platform.domain.repository.PlatformDocumentationRepositoryInterface;
import vantaCore.application.documentation.platform.domain.vo.PlatformGraph;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

@Component
final public class GetPlatformDocumentationQueryHandler implements QueryHandlerInterface<GetPlatformDocumentationQuery, Item<PlatformDocumentationResult>> {

    private final PlatformDocumentationRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final PlatformDocumentationResultAssembler resultAssembler;

    public GetPlatformDocumentationQueryHandler(
        PlatformDocumentationRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        PlatformDocumentationResultAssembler resultAssembler
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.resultAssembler = resultAssembler;
    }

    @Override
    public Item<PlatformDocumentationResult> handle(GetPlatformDocumentationQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        PlatformDocumentationAggregate documentation = this.repository.findLatestByProjectId(projectId)
            .orElseGet(() -> emptyDocumentation(projectId));

        String id = documentation.getVersionId() != null ? documentation.getVersionId().toString() : projectId.toString();

        return Item.fromPayload(id, this.resultAssembler.toResult(documentation));
    }

    private PlatformDocumentationAggregate emptyDocumentation(ProjectId projectId) {
        PlatformGraph emptyGraph = new PlatformGraph(null, null, null, null, null, null, null, null, null, null, null, null);

        return new PlatformDocumentationAggregate(
            null,
            projectId,
            null,
            null,
            emptyGraph,
            null,
            null,
            null
        );
    }
}
