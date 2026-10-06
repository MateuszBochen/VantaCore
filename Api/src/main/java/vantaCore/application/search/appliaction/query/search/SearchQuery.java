package vantaCore.application.search.appliaction.query.search;

import vantaCore.application.search.domain.vo.SearchType;

import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

// Deliberately no @RequiresResource - ADR-002 on the "Wyszukiwarka" sub-project explicitly decided
// against gating search by the caller's resources in v1, to keep the query simple and ship faster;
// any authenticated user can search (still behind /api/**'s plain authentication).
final public class SearchQuery {

    // Optional now - an advanced-search browse can be filters-only, no text at all.
    private final String q;

    // Empty = search every type (project/subProject/ticket/testCase).
    private final Set<SearchType> types;

    // Empty = unscoped/global. Filters project.id for the "project" type, project_id (or the
    // ticket's project_id, joined, for testCase) for the other three.
    private final Set<UUID> projectIds;

    // Ticket-only filters below - simply unused when building a query for another type.
    private final Set<Integer> priorities;
    private final Set<UUID> statusIds;
    // OR within the set - a ticket matches when its issue type is ANY of these, same as statusIds.
    private final Set<UUID> issueTypeIds;
    // OR within the set - a ticket matches when it has ANY of these flags, same as statusIds.
    private final Set<UUID> flagIds;
    private final Set<String> tags;
    private final LocalDate createdFrom;
    private final LocalDate createdTo;
    private final LocalDate updatedFrom;
    private final LocalDate updatedTo;
    private final Map<UUID, String> customFieldFilters;

    // null = no filter, true = estimate > 0, false = estimate == 0 (unset) - see
    // JpaSearchRepositoryAdapter.searchTickets for why 0 is the "no estimate" sentinel.
    private final Boolean hasEstimation;

    // Ticket section only - when true, each ticket hit is the same full object GET
    // .../ticket/{ticketId} returns instead of the lightweight id/projectId/key/title shape.
    private final boolean fullMode;

    private final int page;
    private final int limit;

    public SearchQuery(
        String q,
        Set<SearchType> types,
        Set<UUID> projectIds,
        Set<Integer> priorities,
        Set<UUID> statusIds,
        Set<UUID> issueTypeIds,
        Set<UUID> flagIds,
        Set<String> tags,
        LocalDate createdFrom,
        LocalDate createdTo,
        LocalDate updatedFrom,
        LocalDate updatedTo,
        Map<UUID, String> customFieldFilters,
        Boolean hasEstimation,
        boolean fullMode,
        int page,
        int limit
    ) {
        this.q = q;
        this.types = types == null ? Set.of() : Set.copyOf(types);
        this.projectIds = projectIds == null ? Set.of() : Set.copyOf(projectIds);
        this.priorities = priorities == null ? Set.of() : Set.copyOf(priorities);
        this.statusIds = statusIds == null ? Set.of() : Set.copyOf(statusIds);
        this.issueTypeIds = issueTypeIds == null ? Set.of() : Set.copyOf(issueTypeIds);
        this.flagIds = flagIds == null ? Set.of() : Set.copyOf(flagIds);
        this.tags = tags == null ? Set.of() : Set.copyOf(tags);
        this.createdFrom = createdFrom;
        this.createdTo = createdTo;
        this.updatedFrom = updatedFrom;
        this.updatedTo = updatedTo;
        this.customFieldFilters = customFieldFilters == null ? Map.of() : Map.copyOf(customFieldFilters);
        this.hasEstimation = hasEstimation;
        this.fullMode = fullMode;
        this.page = page;
        this.limit = limit;
    }

    public String getQ() {
        return q;
    }

    public Set<SearchType> getTypes() {
        return types;
    }

    public Set<UUID> getProjectIds() {
        return projectIds;
    }

    public Set<Integer> getPriorities() {
        return priorities;
    }

    public Set<UUID> getStatusIds() {
        return statusIds;
    }

    public Set<UUID> getIssueTypeIds() {
        return issueTypeIds;
    }

    public Set<UUID> getFlagIds() {
        return flagIds;
    }

    public Set<String> getTags() {
        return tags;
    }

    public LocalDate getCreatedFrom() {
        return createdFrom;
    }

    public LocalDate getCreatedTo() {
        return createdTo;
    }

    public LocalDate getUpdatedFrom() {
        return updatedFrom;
    }

    public LocalDate getUpdatedTo() {
        return updatedTo;
    }

    public Map<UUID, String> getCustomFieldFilters() {
        return customFieldFilters;
    }

    public Boolean getHasEstimation() {
        return hasEstimation;
    }

    public boolean isFullMode() {
        return fullMode;
    }

    public int getPage() {
        return page;
    }

    public int getLimit() {
        return limit;
    }

    public boolean includes(SearchType type) {
        return this.types.isEmpty() || this.types.contains(type);
    }
}
