package vantaCore.application.search.appliaction.query.search;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.search.domain.SearchCriteria;
import vantaCore.application.search.domain.repository.SearchRepositoryInterface;
import vantaCore.application.search.domain.repository.SearchRepositoryInterface.SearchPage;
import vantaCore.application.search.domain.repository.SearchRepositoryInterface.TicketHit;
import vantaCore.application.search.domain.vo.SearchType;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.appliaction.query.TicketResultAssembler;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
final public class SearchQueryHandler implements QueryHandlerInterface<SearchQuery, Item<SearchResult>> {

    private final SearchRepositoryInterface searchRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketResultAssembler ticketResultAssembler;

    public SearchQueryHandler(
        SearchRepositoryInterface searchRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        ProjectAggregateRepositoryInterface projectRepository,
        TicketResultAssembler ticketResultAssembler
    ) {
        this.searchRepository = searchRepository;
        this.ticketRepository = ticketRepository;
        this.projectRepository = projectRepository;
        this.ticketResultAssembler = ticketResultAssembler;
    }

    @Override
    public Item<SearchResult> handle(SearchQuery query) {
        SearchCriteria criteria = new SearchCriteria(
            query.getQ(),
            query.getProjectIds(),
            query.getPriorities(),
            query.getStatusIds(),
            query.getIssueTypeIds(),
            query.getFlagIds(),
            query.getTags(),
            query.getCreatedFrom(),
            query.getCreatedTo(),
            query.getUpdatedFrom(),
            query.getUpdatedTo(),
            query.getCustomFieldFilters(),
            query.getHasEstimation()
        );

        int page = query.getPage();
        int limit = query.getLimit();
        int offset = page * limit;

        Collection<SearchProjectResult> projects = query.includes(SearchType.PROJECT)
            ? toCollection(page, limit, this.searchRepository.searchProjects(criteria, limit, offset),
                hit -> Item.fromPayload(hit.id().toString(), new SearchProjectResult(hit.id(), hit.name())))
            : empty(page, limit);

        Collection<SearchSubProjectResult> subProjects = query.includes(SearchType.SUBPROJECT)
            ? toCollection(page, limit, this.searchRepository.searchSubProjects(criteria, limit, offset),
                hit -> Item.fromPayload(hit.id().toString(), new SearchSubProjectResult(hit.id(), hit.projectId(), hit.name())))
            : empty(page, limit);

        Collection<Object> tickets = query.includes(SearchType.TICKET)
            ? resolveTickets(page, limit, this.searchRepository.searchTickets(criteria, limit, offset), query.isFullMode())
            : empty(page, limit);

        Collection<SearchTestCaseResult> testCases = query.includes(SearchType.TESTCASE)
            ? toCollection(page, limit, this.searchRepository.searchTestCases(criteria, limit, offset),
                hit -> Item.fromPayload(hit.id().toString(), new SearchTestCaseResult(hit.id(), hit.ticketId(), hit.projectId(), hit.ticketKey(), hit.title())))
            : empty(page, limit);

        SearchResult result = new SearchResult(projects, subProjects, tickets, testCases);

        return Item.fromPayload(query.getQ() == null ? "search" : query.getQ(), result);
    }

    // fullMode=false: the lightweight id/projectId/key/title hit. fullMode=true: the exact same
    // object GET /api/project/{projectId}/ticket/{ticketId} returns, via the same
    // TicketResultAssembler that endpoint uses - projects are cached per request since several hits
    // commonly share one.
    private Collection<Object> resolveTickets(int page, int limit, SearchPage<TicketHit> hits, boolean fullMode) {
        if (!fullMode) {
            return toCollection(page, limit, hits,
                hit -> Item.<Object>fromPayload(hit.id().toString(), new SearchTicketResult(hit.id(), hit.projectId(), hit.key(), hit.title())));
        }

        Map<UUID, ProjectAggregate> projectCache = new HashMap<>();
        List<Item<Object>> results = new ArrayList<>();

        for (TicketHit hit : hits.hits()) {
            TicketAggregate ticket = this.ticketRepository.findById(new TicketId(hit.id())).orElse(null);
            if (ticket == null) {
                continue;
            }

            ProjectAggregate project = projectCache.computeIfAbsent(
                hit.projectId(),
                id -> this.projectRepository.findById(new ProjectId(id)).orElse(null)
            );
            if (project == null) {
                continue;
            }

            results.add(Item.fromPayload(hit.id().toString(), this.ticketResultAssembler.toResult(ticket, project)));
        }

        return new Collection<>(page, limit, hits.total(), results);
    }

    private <H, T> Collection<T> toCollection(int page, int limit, SearchPage<H> hits, Function<H, Item<T>> toItem) {
        return new Collection<>(page, limit, hits.total(), hits.hits().stream().map(toItem).toList());
    }

    private <T> Collection<T> empty(int page, int limit) {
        return new Collection<>(page, limit, 0, List.of());
    }
}
