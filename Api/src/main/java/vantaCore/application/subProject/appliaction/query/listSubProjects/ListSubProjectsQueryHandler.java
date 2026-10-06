package vantaCore.application.subProject.appliaction.query.listSubProjects;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface.SubProjectSummary;

import java.util.Comparator;
import java.util.List;

@Component
final public class ListSubProjectsQueryHandler implements QueryHandlerInterface<ListSubProjectsQuery, Collection<SubProjectSummaryResult>> {

    private final SubProjectRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;

    public ListSubProjectsQueryHandler(
        SubProjectRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
    }

    @Override
    public Collection<SubProjectSummaryResult> handle(ListSubProjectsQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        List<Item<SubProjectSummaryResult>> items = this.repository.findAllLatestSummariesByProjectId(projectId).stream()
            .sorted(Comparator.comparing(this::sortableName, String.CASE_INSENSITIVE_ORDER))
            .map(summary -> Item.fromPayload(
                summary.id().toString(),
                new SubProjectSummaryResult(
                    summary.id().value(),
                    summary.name() != null ? summary.name().value() : null,
                    summary.status() != null ? summary.status().name() : null
                )
            ))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }

    private String sortableName(SubProjectSummary summary) {
        return summary.name() != null ? summary.name().value() : "";
    }
}
