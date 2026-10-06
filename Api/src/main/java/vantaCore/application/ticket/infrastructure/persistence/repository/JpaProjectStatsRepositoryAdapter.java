package vantaCore.application.ticket.infrastructure.persistence.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import vantaCore.application.ticket.domain.repository.ProjectStatsRepositoryInterface;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Every query below filters on tickets.project_id first (see idx_tickets_project_id, V41), then
 aggregates in memory over that already-small row set - a handful of simple, independently
 index-friendly queries rather than one large multi-CTE query, which would be harder to reason
 about for a marginal round-trip saving. Results are read positionally (Object[]), same convention
 as JpaTicketRepositoryAdapter.findRollup, rather than by alias - Postgres folds an unquoted alias
 to lowercase in its result metadata regardless of how it's written in the SQL, which is an easy way
 to silently break an alias-based lookup; positional access sidesteps that entirely. */
@Repository
public class JpaProjectStatsRepositoryAdapter implements ProjectStatsRepositoryInterface {

    private static final int WEEKS = 10;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @SuppressWarnings("unchecked")
    public ProjectStats getStats(UUID projectId) {
        Object[] totals = (Object[]) this.entityManager.createNativeQuery(
                "SELECT COUNT(*), " +
                "       COUNT(*) FILTER (WHERE s.is_done), " +
                "       COUNT(DISTINCT f.ticket_id) " +
                "FROM tickets t " +
                "LEFT JOIN project_statuses s ON s.id = t.status_id " +
                "LEFT JOIN ticket_flags f ON f.ticket_id = t.id " +
                "WHERE t.project_id = ?1"
            )
            .setParameter(1, projectId)
            .getSingleResult();

        Object[] sums = (Object[]) this.entityManager.createNativeQuery(
                "SELECT COALESCE(SUM(estimate_all), 0), COALESCE(SUM(time_spent_all), 0) " +
                "FROM tickets WHERE project_id = ?1 AND parent_id IS NULL"
            )
            .setParameter(1, projectId)
            .getSingleResult();

        List<Object[]> byStatusRows = this.entityManager.createNativeQuery(
                "SELECT t.status_id, COUNT(*) FROM tickets t WHERE t.project_id = ?1 GROUP BY t.status_id"
            )
            .setParameter(1, projectId)
            .getResultList();

        List<Object[]> byIssueTypeRows = this.entityManager.createNativeQuery(
                "SELECT t.issue_type_id, COUNT(*) FROM tickets t WHERE t.project_id = ?1 GROUP BY t.issue_type_id"
            )
            .setParameter(1, projectId)
            .getResultList();

        List<Object[]> byPriorityRows = this.entityManager.createNativeQuery(
                "SELECT t.priority, COUNT(*) FROM tickets t " +
                "WHERE t.project_id = ?1 AND t.priority IS NOT NULL GROUP BY t.priority"
            )
            .setParameter(1, projectId)
            .getResultList();

        // generate_series zero-fills every week in the window, including weeks with no tickets at
        // all, so the frontend never has to backfill gaps itself - the window bounds are computed
        // here (not via interval arithmetic on a bound int parameter) to keep the query's parameter
        // types unambiguous. currentWeekStart/windowStart are both already Mondays (Postgres
        // date_trunc('week', ...) semantics), matching the "weekStart is always a Monday" contract.
        // CAST(?n AS date), not Postgres' own ?n::date shorthand - Hibernate's native-query
        // parameter parser misreads the "::" right after a numbered placeholder and throws
        // ParameterLabelException ("Ordinal parameter label was not an integer"); CAST(...) sidesteps
        // that parsing ambiguity entirely.
        LocalDate currentWeekStart = LocalDate.now().with(java.time.DayOfWeek.MONDAY);
        LocalDate windowStart = currentWeekStart.minusWeeks(WEEKS - 1L);

        List<Object[]> weekRows = perWeek("created_at", projectId, windowStart, currentWeekStart);
        // Same generate_series window as createdPerWeek, so both series line up index for index.
        // done_at is NULL for not-done tickets, which the LEFT JOIN's equality simply never matches.
        List<Object[]> doneWeekRows = perWeek("done_at", projectId, windowStart, currentWeekStart);

        return new ProjectStats(
            ((Number) totals[0]).longValue(),
            ((Number) totals[1]).longValue(),
            ((Number) totals[2]).longValue(),
            byStatusRows.stream().map(row -> new StatusCount((UUID) row[0], ((Number) row[1]).longValue())).toList(),
            byIssueTypeRows.stream().map(row -> new IssueTypeCount((UUID) row[0], ((Number) row[1]).longValue())).toList(),
            byPriorityRows.stream().map(row -> new PriorityCount(((Number) row[0]).intValue(), ((Number) row[1]).longValue())).toList(),
            ((Number) sums[0]).doubleValue(),
            ((Number) sums[1]).longValue(),
            toWeekBuckets(weekRows),
            toWeekBuckets(doneWeekRows)
        );
    }

    // timestampColumn is always one of our own literals ("created_at"/"done_at"), never user input.
    @SuppressWarnings("unchecked")
    private List<Object[]> perWeek(String timestampColumn, UUID projectId, LocalDate windowStart, LocalDate currentWeekStart) {
        return this.entityManager.createNativeQuery(
                "WITH weeks AS (" +
                "  SELECT generate_series(CAST(?1 AS date), CAST(?2 AS date), interval '1 week')::date AS week_start" +
                ") " +
                "SELECT w.week_start, COUNT(t.id) " +
                "FROM weeks w " +
                "LEFT JOIN tickets t ON date_trunc('week', t." + timestampColumn + ")::date = w.week_start AND t.project_id = ?3 " +
                "GROUP BY w.week_start ORDER BY w.week_start"
            )
            .setParameter(1, windowStart)
            .setParameter(2, currentWeekStart)
            .setParameter(3, projectId)
            .getResultList();
    }

    private List<WeekBucket> toWeekBuckets(List<Object[]> rows) {
        return rows.stream().map(row -> new WeekBucket(toLocalDate(row[0]), ((Number) row[1]).longValue())).toList();
    }

    private LocalDate toLocalDate(Object value) {
        return value instanceof Date date ? date.toLocalDate() : (LocalDate) value;
    }
}
