package vantaCore.application.roadmap.appliaction.query.listRoadmapEntries;

import org.springframework.stereotype.Component;
import vantaCore.application.release.domain.ReleaseAggregate;
import vantaCore.application.release.domain.ReleaseSnapshot;
import vantaCore.application.release.domain.repository.ReleaseAggregateRepositoryInterface;
import vantaCore.application.release.domain.repository.ReleaseAggregateRepositoryInterface.ReleasePage;
import vantaCore.application.roadmap.appliaction.query.listRoadmapEntries.RoadmapEntryResult.RoadmapTicketResult;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;

import java.util.List;

@Component
final public class ListRoadmapEntriesQueryHandler implements QueryHandlerInterface<ListRoadmapEntriesQuery, Collection<RoadmapEntryResult>> {

    private final ReleaseAggregateRepositoryInterface releaseRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;

    public ListRoadmapEntriesQueryHandler(
        ReleaseAggregateRepositoryInterface releaseRepository,
        TicketAggregateRepositoryInterface ticketRepository
    ) {
        this.releaseRepository = releaseRepository;
        this.ticketRepository = ticketRepository;
    }

    @Override
    public Collection<RoadmapEntryResult> handle(ListRoadmapEntriesQuery query) {
        ReleasePage page = this.releaseRepository.findPage(query.getPage(), query.getLimit(), query.getFrom(), query.getTill());

        List<Item<RoadmapEntryResult>> items = page.items().stream()
            .map(ReleaseAggregate::toSnapshot)
            .map(release -> Item.fromPayload(release.id().toString(), toResult(release)))
            .toList();

        return new Collection<>(query.getPage(), query.getLimit(), page.total(), items);
    }

    private RoadmapEntryResult toResult(ReleaseSnapshot release) {
        List<RoadmapTicketResult> tickets = this.ticketRepository.findAllByIds(release.ticketIds()).stream()
            .map(TicketAggregate::toSnapshot)
            .map(ticket -> new RoadmapTicketResult(ticket.id().value(), ticket.statusId(), ticket.title(), ticket.key().value()))
            .toList();

        return new RoadmapEntryResult(
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
