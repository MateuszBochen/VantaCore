-- Nullable - existing releases have no name yet (no backfill, same "only correct going forward"
-- precedent as time_spent_all/estimate_all); new writes through PUT .../release/{id} require it
-- (see UpsertReleaseRequest).
ALTER TABLE releases ADD COLUMN name character varying(255);
