package vantaCore.application.search.infrastructure.persistence;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;
import vantaCore.application.search.domain.SearchCriteria;
import vantaCore.application.search.domain.repository.SearchRepositoryInterface;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Repository
public class JpaSearchRepositoryAdapter implements SearchRepositoryInterface {

    // tsquery operator/punctuation characters - stripped from each raw word before it's used to
    // build a tsquery expression, so user input can never be interpreted as query syntax (unlike
    // websearch_to_tsquery, plain to_tsquery throws a syntax error on malformed input).
    private static final Pattern TSQUERY_SPECIAL_CHARS = Pattern.compile("[&|!():'<>*\\\\]");

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public SearchPage<ProjectHit> searchProjects(SearchCriteria criteria, int limit, int offset) {
        SqlBuilder sql = new SqlBuilder();
        String tsQuery = toPrefixTsQuery(criteria.q());
        boolean hasQuery = !tsQuery.isEmpty();

        if (hasQuery) {
            sql.condition("search_vector @@ to_tsquery('simple', ?)", tsQuery);
        }
        if (!criteria.projectIds().isEmpty()) {
            sql.in("id", criteria.projectIds());
        }

        String orderBy = hasQuery
            ? "ORDER BY ts_rank(search_vector, to_tsquery('simple', ?)) DESC"
            : "ORDER BY name ASC";

        return page(
            "SELECT id, name", "FROM projects " + sql.where(), sql, orderBy, hasQuery ? tsQuery : null, limit, offset,
            row -> new ProjectHit((UUID) row[0], (String) row[1])
        );
    }

    // sub_project_versions is append-only (one row per edit) - DISTINCT ON collapses it to just the
    // latest row per sub_project_id before matching/filtering, so an old version can't produce a
    // stale/duplicate hit. updatedFrom/To filters against that latest row's changed_at.
    @Override
    public SearchPage<SubProjectHit> searchSubProjects(SearchCriteria criteria, int limit, int offset) {
        SqlBuilder sql = new SqlBuilder();
        String tsQuery = toPrefixTsQuery(criteria.q());
        boolean hasQuery = !tsQuery.isEmpty();

        if (hasQuery) {
            sql.condition("search_vector @@ to_tsquery('simple', ?)", tsQuery);
        }
        if (!criteria.projectIds().isEmpty()) {
            sql.in("project_id", criteria.projectIds());
        }
        if (criteria.updatedFrom() != null) {
            sql.condition("changed_at >= ?", startOfDayUtc(criteria.updatedFrom()));
        }
        if (criteria.updatedTo() != null) {
            sql.condition("changed_at < ?", startOfNextDayUtc(criteria.updatedTo()));
        }

        String orderBy = hasQuery
            ? "ORDER BY ts_rank(search_vector, to_tsquery('simple', ?)) DESC"
            : "ORDER BY changed_at DESC";

        String from = """
            FROM (
                SELECT DISTINCT ON (sub_project_id) sub_project_id, project_id, name, search_vector, changed_at
                FROM sub_project_versions
                ORDER BY sub_project_id, changed_at DESC
            ) latest
            """ + sql.where();

        return page(
            "SELECT sub_project_id, project_id, name", from, sql, orderBy, hasQuery ? tsQuery : null, limit, offset,
            row -> new SubProjectHit((UUID) row[0], (UUID) row[1], (String) row[2])
        );
    }

    @Override
    public SearchPage<TicketHit> searchTickets(SearchCriteria criteria, int limit, int offset) {
        SqlBuilder sql = new SqlBuilder();
        String tsQuery = toPrefixTsQuery(criteria.q());
        boolean hasQuery = !tsQuery.isEmpty();

        if (hasQuery) {
            sql.condition("search_vector @@ to_tsquery('simple', ?)", tsQuery);
        }
        if (!criteria.projectIds().isEmpty()) {
            sql.in("project_id", criteria.projectIds());
        }
        if (!criteria.priorities().isEmpty()) {
            sql.in("priority", criteria.priorities());
        }
        if (!criteria.statusIds().isEmpty()) {
            sql.in("status_id", criteria.statusIds());
        }
        if (!criteria.issueTypeIds().isEmpty()) {
            sql.in("issue_type_id", criteria.issueTypeIds());
        }
        // ANY of the given flags (OR), via the ticket_flags element-collection table - same EXISTS
        // shape as the tags filter below.
        if (!criteria.flagIds().isEmpty()) {
            String placeholders = criteria.flagIds().stream().map(flagId -> "?").collect(Collectors.joining(", "));
            sql.condition(
                "EXISTS (SELECT 1 FROM ticket_flags tf WHERE tf.ticket_id = tickets.id AND tf.flag_id IN (" + placeholders + "))",
                criteria.flagIds().toArray()
            );
        }
        if (!criteria.tags().isEmpty()) {
            String placeholders = criteria.tags().stream().map(tag -> "?").collect(Collectors.joining(", "));
            sql.condition(
                "EXISTS (SELECT 1 FROM ticket_tags tt WHERE tt.ticket_id = tickets.id AND tt.tag IN (" + placeholders + "))",
                criteria.tags().toArray()
            );
        }
        if (criteria.createdFrom() != null) {
            sql.condition("created_at >= ?", startOfDayUtc(criteria.createdFrom()));
        }
        if (criteria.createdTo() != null) {
            sql.condition("created_at < ?", startOfNextDayUtc(criteria.createdTo()));
        }
        if (criteria.updatedFrom() != null) {
            sql.condition("changed_at >= ?", startOfDayUtc(criteria.updatedFrom()));
        }
        if (criteria.updatedTo() != null) {
            sql.condition("changed_at < ?", startOfNextDayUtc(criteria.updatedTo()));
        }
        // 0 is the "no estimate" sentinel app-wide (UpsertTicketCommandHandler.toEstimate coerces a
        // null request estimate to 0.0, estimate itself is a non-nullable primitive double) - so
        // "has an estimation" reads as estimate > 0, not estimate IS NOT NULL.
        if (criteria.hasEstimation() != null) {
            sql.condition(criteria.hasEstimation() ? "estimate > 0" : "estimate = 0");
        }
        // Each customField.<id> is a separate AND-ed condition (a different filter dimension).
        // The scalar branch (->>) covers single-valued fields; the array branch (-> ... @>
        // jsonb_build_array(?)) covers `multiple` fields (see CustomFieldSearchTextMapper for the
        // same scalar-vs-array split) - deliberately not using jsonb's "?" contains-operator here,
        // Hibernate's native query parser reads every bare "?" as its own parameter placeholder
        // (including inside "??", which is not treated as an escape in this query-creation path),
        // so "@>" avoids the character entirely instead of fighting the parser over it.
        for (var entry : criteria.customFieldFilters().entrySet()) {
            String key = entry.getKey().toString();
            String value = entry.getValue();
            sql.condition("(custom_fields ->> ? = ? OR custom_fields -> ? @> jsonb_build_array(?))", key, value, key, value);
        }

        String orderBy = hasQuery
            ? "ORDER BY ts_rank(search_vector, to_tsquery('simple', ?)) DESC"
            : "ORDER BY changed_at DESC";

        return page(
            "SELECT id, project_id, key, title", "FROM tickets " + sql.where(), sql, orderBy, hasQuery ? tsQuery : null, limit, offset,
            row -> new TicketHit((UUID) row[0], (UUID) row[1], (String) row[2], (String) row[3])
        );
    }

    // test_cases has no changed_at column at all, so updatedFrom/To simply never applies here -
    // not an error, just nothing to filter on.
    @Override
    public SearchPage<TestCaseHit> searchTestCases(SearchCriteria criteria, int limit, int offset) {
        SqlBuilder sql = new SqlBuilder();
        String tsQuery = toPrefixTsQuery(criteria.q());
        boolean hasQuery = !tsQuery.isEmpty();

        if (hasQuery) {
            sql.condition("tc.search_vector @@ to_tsquery('simple', ?)", tsQuery);
        }
        if (!criteria.projectIds().isEmpty()) {
            sql.in("t.project_id", criteria.projectIds());
        }
        if (criteria.createdFrom() != null) {
            sql.condition("tc.created_at >= ?", startOfDayUtc(criteria.createdFrom()));
        }
        if (criteria.createdTo() != null) {
            sql.condition("tc.created_at < ?", startOfNextDayUtc(criteria.createdTo()));
        }

        String orderBy = hasQuery
            ? "ORDER BY ts_rank(tc.search_vector, to_tsquery('simple', ?)) DESC"
            : "ORDER BY tc.created_at DESC";

        String from = """
            FROM test_cases tc
            JOIN tickets t ON t.id = tc.ticket_id
            """ + sql.where();

        return page(
            "SELECT tc.id, tc.ticket_id, t.project_id, t.key, tc.title", from, sql, orderBy, hasQuery ? tsQuery : null, limit, offset,
            row -> new TestCaseHit((UUID) row[0], (UUID) row[1], (UUID) row[2], (String) row[3], (String) row[4])
        );
    }

    // Builds a tsquery expression where every word is AND-ed together and the LAST word is a
    // prefix match ("van & core:*") - the frontend searches live as the user types (300ms debounce,
    // no Enter needed), so the word currently being typed is almost never complete;
    // websearch_to_tsquery has no prefix syntax at all, hence building the tsquery by hand here
    // instead. Returns "" (meaning: no text filter at all - an advanced-search browse can be
    // filters-only) both when q is blank/absent and when nothing usable remains after stripping
    // tsquery operator characters.
    private String toPrefixTsQuery(String query) {
        if (query == null || query.isBlank()) {
            return "";
        }

        List<String> tokens = new ArrayList<>();

        for (String word : query.trim().split("\\s+")) {
            String cleaned = TSQUERY_SPECIAL_CHARS.matcher(word).replaceAll("");
            if (!cleaned.isBlank()) {
                tokens.add(cleaned);
            }
        }

        if (tokens.isEmpty()) {
            return "";
        }

        int lastIndex = tokens.size() - 1;
        tokens.set(lastIndex, tokens.get(lastIndex) + ":*");

        return String.join(" & ", tokens);
    }

    private Instant startOfDayUtc(LocalDate date) {
        return date.atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    // Used as an exclusive upper bound so the whole "to" calendar day is included.
    private Instant startOfNextDayUtc(LocalDate date) {
        return date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    // Runs the page query plus a COUNT(*) over the exact same FROM/WHERE (and its params), so the
    // total always matches what paging through every page would return. orderByParam is the
    // tsquery bound into ORDER BY's ts_rank(...) when there's a text query, null otherwise - only
    // the page query has an ORDER BY, the count doesn't need it.
    private <T> SearchPage<T> page(
        String select,
        String fromWhere,
        SqlBuilder sql,
        String orderBy,
        String orderByParam,
        int limit,
        int offset,
        Function<Object[], T> mapper
    ) {
        List<Object> params = new ArrayList<>(sql.params());
        if (orderByParam != null) {
            params.add(orderByParam);
        }
        params.add(limit);
        params.add(offset);

        Query pageQuery = bind(this.entityManager.createNativeQuery(select + " " + fromWhere + " " + orderBy + " LIMIT ? OFFSET ?"), params);
        List<T> hits = resultList(pageQuery, mapper);

        Query countQuery = bind(this.entityManager.createNativeQuery("SELECT COUNT(*) " + fromWhere), sql.params());
        long total = ((Number) countQuery.getSingleResult()).longValue();

        return new SearchPage<>(hits, total);
    }

    private Query bind(Query nativeQuery, List<Object> params) {
        for (int i = 0; i < params.size(); i++) {
            nativeQuery.setParameter(i + 1, params.get(i));
        }

        return nativeQuery;
    }

    @SuppressWarnings("unchecked")
    private <T> List<T> resultList(Query nativeQuery, Function<Object[], T> mapper) {
        List<Object[]> rows = nativeQuery.getResultList();
        return rows.stream().map(mapper).toList();
    }

    // Collects WHERE conditions and their bound values together, in append order, so the final
    // param list always lines up with the "?" placeholders as they appear reading the assembled
    // SQL text top to bottom - all placeholders here are unnumbered/positional (bound via
    // setParameter(1-based index, value) in `bind`), not JPA's "?N" ordinal syntax, since that
    // syntax has already caused Hibernate parsing trouble elsewhere in this class (a "?N" directly
    // followed by "::" was misread as part of the ordinal label).
    private static final class SqlBuilder {
        private final List<String> conditions = new ArrayList<>();
        private final List<Object> params = new ArrayList<>();

        void condition(String sql, Object... conditionParams) {
            conditions.add(sql);
            for (Object param : conditionParams) {
                params.add(param);
            }
        }

        void in(String column, Collection<?> values) {
            String placeholders = values.stream().map(value -> "?").collect(Collectors.joining(", "));
            condition(column + " IN (" + placeholders + ")", values.toArray());
        }

        String where() {
            return conditions.isEmpty() ? "" : "WHERE " + String.join(" AND ", conditions);
        }

        List<Object> params() {
            return params;
        }
    }
}
