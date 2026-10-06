-- Same reasoning as time_spent_all (V5/V7): rollup of this ticket's own estimate + every descendant's,
-- deliberately not mapped in TicketEntity so a full-replace PUT can't clobber it. Only touched via
-- PropagateEstimateCommandHandler's atomic UPDATE ... SET estimate_all = estimate_all + ? statements.
-- No backfill for existing rows with children - same precedent as time_spent_all, only correct going
-- forward from each ticket's next edit.
ALTER TABLE tickets ADD COLUMN estimate_all double precision NOT NULL DEFAULT 0;
