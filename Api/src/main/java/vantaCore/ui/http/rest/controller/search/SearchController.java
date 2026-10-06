package vantaCore.ui.http.rest.controller.search;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.search.appliaction.query.search.SearchQuery;
import vantaCore.application.search.appliaction.query.search.SearchResult;
import vantaCore.application.search.domain.vo.SearchType;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Single;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/search")
final public class SearchController {

    private static final String CUSTOM_FIELD_PREFIX = "customField.";

    private final QueryBusInterface queryBus;

    SearchController(QueryBusInterface queryBus) {
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Single<SearchResult>> search(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String types,
        @RequestParam(required = false) String projectIds,
        // Legacy topbar-search params (single project, explicit scope) - still accepted and folded
        // into projectIds via resolveProjectIds() when the new plural param isn't given, so the
        // existing SearchBar keeps working unchanged.
        @RequestParam(required = false) String scope,
        @RequestParam(required = false) UUID projectId,
        @RequestParam(required = false) String priorities,
        @RequestParam(required = false) String statusIds,
        @RequestParam(required = false) String issueTypeIds,
        @RequestParam(required = false) String flagIds,
        @RequestParam(required = false) String tags,
        @RequestParam(required = false) Boolean hasEstimation,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate updatedFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate updatedTo,
        // Arbitrary customField.<definitionId>=<value> params - not a fixed set of names, so bound
        // as a raw map and filtered by prefix rather than as individual @RequestParams. Spring
        // populates this with every query param regardless of the explicit ones above; only the
        // customField.* entries are used here.
        @RequestParam Map<String, String> allParams,
        // Ticket section only - full GET-ticket-shaped objects instead of the lightweight hit.
        @RequestParam(defaultValue = "false") boolean fullMode,
        // Same default as ListTicketsQuery's pagination (TicketController).
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "25") int limit
    ) throws Exception {

        SearchQuery query = new SearchQuery(
            q,
            parseTypes(types),
            resolveProjectIds(projectIds, scope, projectId),
            parsePriorities(priorities),
            parseUuidList(statusIds),
            parseUuidList(issueTypeIds),
            parseUuidList(flagIds),
            parseTags(tags),
            createdFrom,
            createdTo,
            updatedFrom,
            updatedTo,
            parseCustomFieldFilters(allParams),
            hasEstimation,
            fullMode,
            page,
            limit
        );

        Item<SearchResult> result = this.queryBus.ask(query);

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    private Set<SearchType> parseTypes(String types) {
        if (types == null || types.isBlank()) {
            return Set.of();
        }

        Set<SearchType> result = new HashSet<>();
        for (String type : types.split(",")) {
            try {
                result.add(SearchType.valueOf(type.trim().toUpperCase()));
            } catch (IllegalArgumentException exception) {
                throw invalid("invalid-type", "types must be a comma-separated list of project, subProject, ticket, testCase");
            }
        }

        return result;
    }

    private Set<UUID> resolveProjectIds(String projectIds, String scope, UUID projectId) {
        if (projectIds != null && !projectIds.isBlank()) {
            return parseUuidList(projectIds);
        }

        if (scope == null) {
            return Set.of();
        }

        if ("project".equalsIgnoreCase(scope)) {
            return projectId == null ? Set.of() : Set.of(projectId);
        }

        if (!"global".equalsIgnoreCase(scope)) {
            throw invalid("invalid-scope", "scope must be 'project' or 'global'");
        }

        return Set.of();
    }

    private Set<Integer> parsePriorities(String priorities) {
        if (priorities == null || priorities.isBlank()) {
            return Set.of();
        }

        Set<Integer> result = new HashSet<>();
        for (String priority : priorities.split(",")) {
            try {
                result.add(Integer.parseInt(priority.trim()));
            } catch (NumberFormatException exception) {
                throw invalid("invalid-priority", "priorities must be a comma-separated list of integers");
            }
        }

        return result;
    }

    private Set<UUID> parseUuidList(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }

        Set<UUID> result = new HashSet<>();
        for (String id : value.split(",")) {
            result.add(parseUuid(id.trim()));
        }

        return result;
    }

    private Set<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return Set.of();
        }

        return Set.of(tags.split(","));
    }

    private Map<UUID, String> parseCustomFieldFilters(Map<String, String> allParams) {
        Map<UUID, String> result = new HashMap<>();

        for (Map.Entry<String, String> entry : allParams.entrySet()) {
            if (entry.getKey().startsWith(CUSTOM_FIELD_PREFIX)) {
                UUID definitionId = parseUuid(entry.getKey().substring(CUSTOM_FIELD_PREFIX.length()));
                result.put(definitionId, entry.getValue());
            }
        }

        return result;
    }

    private UUID parseUuid(String value) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException exception) {
            throw invalid("invalid-id", "'" + value + "' is not a valid id");
        }
    }

    private UnprocessableEntityException invalid(String code, String message) {
        return new UnprocessableEntityException(List.of(new Notification(code, message, true)));
    }
}
