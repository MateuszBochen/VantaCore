-- Optional planned post-release "after care" window (how long the team expects to actively
-- watch/patch a release after it ships). Stored verbatim as the ISO-8601 duration string the
-- frontend sends (P1D..P6D, P1W, P2W, P1M, P2M) - same "backend-neutral, store as given" choice
-- as status/version_number. Nullable: existing releases have none, and '' from the client maps
-- to NULL (see UpsertReleaseCommandHandler).
ALTER TABLE releases ADD COLUMN after_care_period character varying(255);

-- planned_release_date is now optional too - a version can be drafted before its date is known,
-- and the client sends '' (-> NULL) until one is picked (see UpsertReleaseRequest).
ALTER TABLE releases ALTER COLUMN planned_release_date DROP NOT NULL;
