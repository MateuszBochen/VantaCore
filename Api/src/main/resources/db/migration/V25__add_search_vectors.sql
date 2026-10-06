-- Global search (VC-1036/1037/1038) - Postgres full-text search via generated tsvector columns,
-- 'simple' config since this app's content is mixed PL/EN (no stemming assumptions either way).

ALTER TABLE projects ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name, ''))) STORED;
CREATE INDEX idx_projects_search_vector ON projects USING GIN (search_vector);

-- sub_project_versions is append-only (new row per edit - see SubProjectEntity/UpsertSubProjectCommandHandler),
-- so the generated column here is per-row; the search query itself is responsible for only
-- considering the latest version per sub_project_id (DISTINCT ON), not this schema.
ALTER TABLE sub_project_versions ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name, ''))) STORED;
CREATE INDEX idx_sub_project_versions_search_vector ON sub_project_versions USING GIN (search_vector);
CREATE INDEX idx_sub_project_versions_sub_project_id_changed_at ON sub_project_versions (sub_project_id, changed_at DESC);

-- custom_fields_search_text is a maintained (not generated) column - custom field values need
-- project-specific lookups (option labels, user names) that a SQL generated-column expression can't
-- do. Populated by CustomFieldSearchTextMapper via JpaTicketRepositoryAdapter.updateCustomFieldsSearchText,
-- the same atomic-UPDATE shape as time_spent_all/estimate_all (V7/V13) - no backfill for existing
-- rows, same precedent, only correct going forward from each ticket's next edit.
ALTER TABLE tickets ADD COLUMN custom_fields_search_text text NOT NULL DEFAULT '';
ALTER TABLE tickets ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('simple',
        coalesce(key, '') || ' ' || coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(custom_fields_search_text, '')
    )) STORED;
CREATE INDEX idx_tickets_search_vector ON tickets USING GIN (search_vector);

ALTER TABLE test_cases ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title, ''))) STORED;
CREATE INDEX idx_test_cases_search_vector ON test_cases USING GIN (search_vector);
