package vantaCore.application.ticket.appliaction.query.getProjectStats;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.domain.repository.ProjectStatsRepositoryInterface;
import vantaCore.application.ticket.domain.repository.ProjectStatsRepositoryInterface.ProjectStats;

@Component
final public class GetProjectStatsQueryHandler implements QueryHandlerInterface<GetProjectStatsQuery, Item<ProjectStatsResult>> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final ProjectStatsRepositoryInterface statsRepository;

    public GetProjectStatsQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        ProjectStatsRepositoryInterface statsRepository
    ) {
        this.projectRepository = projectRepository;
        this.statsRepository = statsRepository;
    }

    @Override
    public Item<ProjectStatsResult> handle(GetProjectStatsQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        ProjectStats stats = this.statsRepository.getStats(projectId.value());

        ProjectStatsResult result = new ProjectStatsResult(
            stats.ticketsTotal(),
            stats.ticketsDone(),
            stats.ticketsFlagged(),
            stats.byStatus().stream().map(s -> new StatusCountResult(s.statusId(), s.count())).toList(),
            stats.byIssueType().stream().map(s -> new IssueTypeCountResult(s.issueTypeId(), s.count())).toList(),
            stats.byPriority().stream().map(s -> new PriorityCountResult(s.priority(), s.count())).toList(),
            stats.estimateTotal(),
            stats.loggedMinutesTotal(),
            stats.createdPerWeek().stream().map(w -> new CreatedPerWeekResult(w.weekStart(), w.count())).toList(),
            stats.donePerWeek().stream().map(w -> new DonePerWeekResult(w.weekStart(), w.count())).toList()
        );

        return Item.fromPayload(projectId.toString(), result);
    }
}
