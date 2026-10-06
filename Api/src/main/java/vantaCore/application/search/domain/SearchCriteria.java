package vantaCore.application.search.domain;

import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Everything a search query might filter on, type-agnostic - each SearchRepositoryInterface
 method applies only the fields relevant to its own type (see the filter-applicability table in
 the search feature's implementation notes) and ignores the rest. Lives in the domain layer so the
 port (SearchRepositoryInterface) doesn't depend on the appliaction-layer SearchQuery. */
public record SearchCriteria(
    String q,
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
    Boolean hasEstimation
) {
}
