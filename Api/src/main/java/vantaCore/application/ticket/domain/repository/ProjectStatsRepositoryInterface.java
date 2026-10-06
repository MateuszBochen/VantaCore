package vantaCore.application.ticket.domain.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Backs GET .../project/{projectId}/stats - a pure read model (no identity/lifecycle of its own),
 computed straight from the tickets table via GROUP BY/COUNT/SUM, never materialized/kept in sync
 on every ticket write. At the ~100k-tickets-per-project scale this endpoint has to handle (it's the
 project's own landing page), a handful of indexed aggregate queries (see
 idx_tickets_project_id, V41) is both simpler and faster than maintaining a denormalized stats row
 that every ticket/status/flag/worklog mutation across several modules would have to keep current. */
public interface ProjectStatsRepositoryInterface {

    ProjectStats getStats(UUID projectId);

    record ProjectStats(
        long ticketsTotal,
        long ticketsDone,
        long ticketsFlagged,
        List<StatusCount> byStatus,
        List<IssueTypeCount> byIssueType,
        List<PriorityCount> byPriority,
        double estimateTotal,
        long loggedMinutesTotal,
        List<WeekBucket> createdPerWeek,
        // Same weeks, same order as createdPerWeek (index i is the same week in both) - tickets whose
        // done_at falls in that week, i.e. that most recently became done then.
        List<WeekBucket> donePerWeek
    ) {
    }

    record StatusCount(UUID statusId, long count) {
    }

    record IssueTypeCount(UUID issueTypeId, long count) {
    }

    record PriorityCount(int priority, long count) {
    }

    /** weekStart is always a Monday (Postgres date_trunc('week', ...) semantics) - see
     JpaProjectStatsRepositoryAdapter.WEEKS for the window size. */
    record WeekBucket(LocalDate weekStart, long count) {
    }
}
