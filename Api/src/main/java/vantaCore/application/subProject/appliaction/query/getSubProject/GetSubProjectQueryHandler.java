package vantaCore.application.subProject.appliaction.query.getSubProject;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.subProject.appliaction.query.SubProjectResultAssembler;
import vantaCore.application.subProject.appliaction.query.result.SubProjectResult;
import vantaCore.application.subProject.domain.SubProjectAggregate;
import vantaCore.application.subProject.domain.exception.SubProjectNotFoundException;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface;
import vantaCore.application.subProject.domain.vo.SubProjectId;

@Component
final public class GetSubProjectQueryHandler implements QueryHandlerInterface<GetSubProjectQuery, Item<SubProjectResult>> {

    private final SubProjectRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final SubProjectResultAssembler resultAssembler;

    public GetSubProjectQueryHandler(
        SubProjectRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        SubProjectResultAssembler resultAssembler
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.resultAssembler = resultAssembler;
    }

    @Override
    public Item<SubProjectResult> handle(GetSubProjectQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        SubProjectId subProjectId = new SubProjectId(query.getSubProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        SubProjectAggregate subProject = this.repository.findLatestBySubProjectId(projectId, subProjectId)
            .orElseThrow(SubProjectNotFoundException::new);

        return Item.fromPayload(subProject.getVersionId().toString(), this.resultAssembler.toResult(subProject));
    }
}
