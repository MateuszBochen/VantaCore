-- Unit-agnostic (SP, man-days, hours, whatever the team agrees on) - just a plain number, no unit
-- tracked at all. DEFAULT 0 covers both new rows and backfills existing ones in the same statement.
ALTER TABLE tickets ADD COLUMN estimate double precision NOT NULL DEFAULT 0;
