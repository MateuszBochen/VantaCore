-- Project Stats (GET .../project/{projectId}/stats) and every existing per-project ticket query
-- (list, search, board rail, ...) filter on tickets.project_id, which has never had an index of its
-- own (only the FK constraint, which Postgres does NOT index automatically unlike MySQL) - at
-- ~100k tickets that's a full table scan on the app's own main project landing page. A single
-- leading-column index is enough: every stats aggregate below narrows to one project's rows via
-- this index first, then GROUP BY/COUNT/SUM in memory over that already-small row set.
CREATE INDEX idx_tickets_project_id ON tickets (project_id);
