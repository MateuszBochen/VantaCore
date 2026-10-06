package vantaCore.application.release.appliaction.query.listReleases;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.release.domain.ReleaseAggregate;
import vantaCore.application.release.domain.ReleaseSnapshot;
import vantaCore.application.release.domain.repository.ReleaseAggregateRepositoryInterface;
import vantaCore.application.release.domain.repository.ReleaseAggregateRepositoryInterface.ReleasePage;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.appliaction.query.TicketResultAssembler;
import vantaCore.application.ticket.appliaction.query.getTicket.GetTicketResult;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;

import java.util.List;

@Component
final public class ListReleasesQueryHandler implements QueryHandlerInterface<ListReleasesQuery, Collection<ReleaseResult>> {

    private final ReleaseAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final TicketResultAssembler resultAssembler;

    public ListReleasesQueryHandler(
        ReleaseAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        TicketResultAssembler resultAssembler
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.resultAssembler = resultAssembler;
    }

    @Override
    public Collection<ReleaseResult> handle(ListReleasesQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());

        ProjectAggregate project = this.projectRepository.findById(projectId)
            .orElseThrow(ProjectNotFoundException::new);

        ReleasePage page = this.repository.findPageByProjectId(projectId.value(), query.getPage(), query.getLimit());

        List<Item<ReleaseResult>> items = page.items().stream()
            .map(ReleaseAggregate::toSnapshot)
            .map(release -> Item.fromPayload(release.id().toString(), toResult(release, project)))
            .toList();

        return new Collection<>(query.getPage(), query.getLimit(), page.total(), items);
    }

    private ReleaseResult toResult(ReleaseSnapshot release, ProjectAggregate project) {
        List<GetTicketResult> tickets = this.ticketRepository.findAllByIds(release.ticketIds()).stream()
            .map(ticket -> this.resultAssembler.toResult(ticket, project))
            .toList();

        return new ReleaseResult(
            release.id().value(),
            release.projectId(),
            release.plannedReleaseDate(),
            release.afterCarePeriod(),
            release.status().name().toLowerCase(),
            release.versionNumber(),
            release.name(),
            tickets
        );
    }
}
