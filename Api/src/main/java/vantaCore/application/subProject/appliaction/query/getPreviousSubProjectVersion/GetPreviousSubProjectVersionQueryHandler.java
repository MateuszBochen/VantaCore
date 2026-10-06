package vantaCore.application.subProject.appliaction.query.getPreviousSubProjectVersion;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.subProject.appliaction.query.SubProjectResultAssembler;
import vantaCore.application.subProject.appliaction.query.result.SubProjectResult;
import vantaCore.application.subProject.domain.SubProjectAggregate;
import vantaCore.application.subProject.domain.exception.SubProjectVersionNotFoundException;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface;
import vantaCore.application.subProject.domain.vo.SubProjectId;

@Component
final public class GetPreviousSubProjectVersionQueryHandler
    implements QueryHandlerInterface<GetPreviousSubProjectVersionQuery, Item<SubProjectResult>> {

    private final SubProjectRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final SubProjectResultAssembler resultAssembler;

    public GetPreviousSubProjectVersionQueryHandler(
        SubProjectRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        SubProjectResultAssembler resultAssembler
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.resultAssembler = resultAssembler;
    }

    @Override
    public Item<SubProjectResult> handle(GetPreviousSubProjectVersionQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        SubProjectId subProjectId = new SubProjectId(query.getSubProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        SubProjectAggregate version = this.repository.findVersionBefore(projectId, subProjectId, query.getBefore())
            .orElseThrow(SubProjectVersionNotFoundException::new);

        return Item.fromPayload(version.getVersionId().toString(), this.resultAssembler.toResult(version));
    }
}
