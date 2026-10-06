package vantaCore.application.project.appliaction.query.listProjects;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

import java.util.List;

@Component
final public class ListProjectsQueryHandler implements QueryHandlerInterface<ListProjectsQuery, Collection<ProjectSummaryResult>> {

    private final ProjectAggregateRepositoryInterface repository;

    public ListProjectsQueryHandler(ProjectAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Collection<ProjectSummaryResult> handle(ListProjectsQuery query) {
        List<Item<ProjectSummaryResult>> items = this.repository.findAllSummaries().stream()
            .map(summary -> Item.fromPayload(
                summary.id().toString(),
                new ProjectSummaryResult(summary.id().value(), summary.name())
            ))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }
}
