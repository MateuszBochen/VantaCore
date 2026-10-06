package vantaCore.application.worklog.appliaction.query.listMyWorklog;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.worklog.appliaction.query.listWorklog.WorklogActorResult;
import vantaCore.application.worklog.domain.WorklogEntryAggregate;
import vantaCore.application.worklog.domain.WorklogEntrySnapshot;
import vantaCore.application.worklog.domain.repository.WorklogEntryAggregateRepositoryInterface;
import vantaCore.application.worklog.domain.repository.WorklogEntryAggregateRepositoryInterface.WorklogPage;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
final public class ListMyWorklogQueryHandler implements QueryHandlerInterface<ListMyWorklogQuery, Collection<MyWorklogResult>> {

    private final WorklogEntryAggregateRepositoryInterface repository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final CurrentUserProviderInterface currentUserProvider;

    public ListMyWorklogQueryHandler(
        WorklogEntryAggregateRepositoryInterface repository,
        TicketAggregateRepositoryInterface ticketRepository,
        ProjectAggregateRepositoryInterface projectRepository,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.repository = repository;
        this.ticketRepository = ticketRepository;
        this.projectRepository = projectRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Collection<MyWorklogResult> handle(ListMyWorklogQuery query) {
        Set<UUID> userIds = query.getUserIds().isEmpty()
            ? Set.of(this.currentUserProvider.getCurrentUserId().value())
            : query.getUserIds();

        WorklogPage page = this.repository.findAllByUserIdsAndDateBetween(
            userIds, query.getStartDate(), query.getEndDate(), query.getPage(), query.getLimit()
        );

        Map<UUID, ProjectAggregate> projectCache = new HashMap<>();
        List<Item<MyWorklogResult>> items = new ArrayList<>();

        for (WorklogEntryAggregate entry : page.items()) {
            Item<MyWorklogResult> item = toItem(entry, projectCache);
            if (item != null) {
                items.add(item);
            }
        }

        return new Collection<>(query.getPage(), query.getLimit(), page.total(), items);
    }

    // A vanished ticket/project (tickets aren't deletable in this app today, so effectively never
    // happens) is skipped rather than failing the whole page - same best-effort precedent as
    // CloseSprintCommandHandler's report building.
    private Item<MyWorklogResult> toItem(WorklogEntryAggregate entry, Map<UUID, ProjectAggregate> projectCache) {
        WorklogEntrySnapshot snapshot = entry.toSnapshot();

        TicketAggregate ticket = this.ticketRepository.findById(new TicketId(snapshot.ticketId())).orElse(null);
        if (ticket == null) {
            return null;
        }

        TicketSnapshot ticketSnapshot = ticket.toSnapshot();

        ProjectAggregate project = projectCache.computeIfAbsent(
            ticketSnapshot.projectId(),
            id -> this.projectRepository.findById(new ProjectId(id)).orElse(null)
        );
        if (project == null) {
            return null;
        }

        MyWorklogResult result = new MyWorklogResult(
            snapshot.id().value(),
            snapshot.minutes(),
            snapshot.date(),
            snapshot.note(),
            new WorklogActorResult(snapshot.userId()),
            new MyWorklogTicketResult(ticketSnapshot.id().value(), ticketSnapshot.key().value(), ticketSnapshot.title()),
            new MyWorklogProjectResult(project.getId().value(), project.getName() != null ? project.getName().value() : null)
        );

        return Item.fromPayload(snapshot.id().toString(), result);
    }
}
