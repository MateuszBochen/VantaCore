package vantaCore.application.vcs.appliaction.query.listVcsConnections;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.vcs.domain.VcsConnectionSnapshot;
import vantaCore.application.vcs.domain.repository.VcsConnectionRepositoryInterface;

import java.util.List;

@Component
final public class ListVcsConnectionsQueryHandler
    implements QueryHandlerInterface<ListVcsConnectionsQuery, Collection<VcsConnectionSummaryResult>> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final VcsConnectionRepositoryInterface connectionRepository;

    public ListVcsConnectionsQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        VcsConnectionRepositoryInterface connectionRepository
    ) {
        this.projectRepository = projectRepository;
        this.connectionRepository = connectionRepository;
    }

    @Override
    public Collection<VcsConnectionSummaryResult> handle(ListVcsConnectionsQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        List<VcsConnectionSnapshot> connections = this.connectionRepository.findAllByProjectId(projectId.value());

        List<Item<VcsConnectionSummaryResult>> items = connections.stream()
            .map(connection -> new VcsConnectionSummaryResult(connection.id().value(), connection.provider(), connection.repoUrl()))
            .map(result -> Item.fromPayload(result.id().toString(), result))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }
}
