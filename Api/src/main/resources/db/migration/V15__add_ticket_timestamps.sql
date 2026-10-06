-- created_at is fixed at creation (like author_id); changed_at is overwritten on every save, both
-- normal application-set fields (unlike time_spent/estimate_all, nothing outside this ticket's own
-- PUT ever writes to them, so no clobber risk from unrelated writers - these can be plain mapped
-- columns). DEFAULT now() only matters for backfilling existing rows at migration time; every new
-- ticket gets its real value set by UpsertTicketCommandHandler.
ALTER TABLE tickets ADD COLUMN created_at timestamp(6) with time zone NOT NULL DEFAULT now();
ALTER TABLE tickets ADD COLUMN changed_at timestamp(6) with time zone NOT NULL DEFAULT now();
