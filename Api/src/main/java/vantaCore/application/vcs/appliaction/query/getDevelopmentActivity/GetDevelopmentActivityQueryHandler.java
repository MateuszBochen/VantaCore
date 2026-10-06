package vantaCore.application.vcs.appliaction.query.getDevelopmentActivity;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.vcs.domain.DevelopmentActivityAggregate;
import vantaCore.application.vcs.domain.DevelopmentActivitySnapshot;
import vantaCore.application.vcs.domain.repository.DevelopmentActivityRepositoryInterface;
import vantaCore.application.vcs.domain.vo.DevelopmentPullRequest;

import java.util.Set;
import java.util.stream.Collectors;

@Component
final public class GetDevelopmentActivityQueryHandler
    implements QueryHandlerInterface<GetDevelopmentActivityQuery, Item<DevelopmentActivityResult>> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final DevelopmentActivityRepositoryInterface activityRepository;

    public GetDevelopmentActivityQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        DevelopmentActivityRepositoryInterface activityRepository
    ) {
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.activityRepository = activityRepository;
    }

    @Override
    public Item<DevelopmentActivityResult> handle(GetDevelopmentActivityQuery query) {
        this.projectRepository.findById(new ProjectId(query.getProjectId())).orElseThrow(ProjectNotFoundException::new);

        TicketId ticketId = new TicketId(query.getTicketId());
        TicketSnapshot ticket = this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new).toSnapshot();

        if (!ticket.projectId().equals(query.getProjectId())) {
            throw new TicketNotFoundException();
        }

        DevelopmentActivitySnapshot activity = this.activityRepository.findByTicketId(ticketId.value())
            .map(DevelopmentActivityAggregate::toSnapshot)
            .orElseGet(() -> DevelopmentActivityAggregate.empty(ticketId.value()).toSnapshot());

        DevelopmentActivityResult result = new DevelopmentActivityResult(
            activity.ticketId(),
            activity.branches(),
            activity.commits(),
            toPullRequestResults(activity.pullRequests()),
            activity.deployments()
        );

        return Item.fromPayload(ticketId.toString(), result);
    }

    private Set<DevelopmentPullRequestResult> toPullRequestResults(Set<DevelopmentPullRequest> pullRequests) {
        return pullRequests.stream()
            .map(pr -> new DevelopmentPullRequestResult(pr.id(), pr.title(), pr.status(), pr.approvalsCount(), pr.url()))
            .collect(Collectors.toSet());
    }
}
