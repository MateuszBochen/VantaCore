-- When the ticket last entered a done status (project_statuses.is_done) - NULL while it's in a
-- non-done status. Maintained by TicketAggregate itself (see its doneAt handling): set on a
-- not-done -> done transition, cleared on reopen, left untouched on done -> done. Unlike
-- progress/time_spent_all/estimate_all this IS a normally mapped column, since it always changes
-- together with status_id in the same save, never independently of it.
ALTER TABLE tickets ADD COLUMN done_at timestamp(6) with time zone;

-- Backfill for tickets that are done right now - an approximation, good enough for the stats chart:
--   1. changed_at of the latest history snapshot where statusId switched INTO a done status
--      (previous snapshot absent or in a non-done status),
--   2. else changed_at of the latest history snapshot at all (e.g. closed by
--      PropagateAutomationCommandHandler, which doesn't write ticket_history),
--   3. else the ticket's own created_at.
WITH history AS (
    SELECT
        h.ticket_id,
        h.changed_at,
        ps.is_done AS is_done,
        LAG(ps.is_done) OVER (PARTITION BY h.ticket_id ORDER BY h.changed_at) AS previous_is_done
    FROM ticket_history h
    LEFT JOIN project_statuses ps ON ps.id::text = h.snapshot ->> 'statusId'
),
last_done_transition AS (
    SELECT ticket_id, MAX(changed_at) AS changed_at
    FROM history
    WHERE is_done IS TRUE AND previous_is_done IS NOT TRUE
    GROUP BY ticket_id
),
last_history AS (
    SELECT ticket_id, MAX(changed_at) AS changed_at
    FROM ticket_history
    GROUP BY ticket_id
)
UPDATE tickets t
SET done_at = COALESCE(
    (SELECT ldt.changed_at FROM last_done_transition ldt WHERE ldt.ticket_id = t.id),
    (SELECT lh.changed_at FROM last_history lh WHERE lh.ticket_id = t.id),
    t.created_at
)
FROM project_statuses ps
WHERE ps.id = t.status_id
  AND ps.is_done;

-- Backs the donePerWeek bucket query in JpaProjectStatsRepositoryAdapter.
CREATE INDEX idx_tickets_project_id_done_at ON tickets (project_id, done_at);
