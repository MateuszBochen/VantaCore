-- Platform Documentation indexing (V29) wiped and rebuilt EVERY chunk for a project on each save,
-- which was fine while it was the only source - but Project Docs/ADRs (per sub-project) are about
-- to become a second source feeding the same table, and a project has one Platform Documentation
-- but many sub-projects. owner_id is the id of the "document group" a chunk was produced from -
-- projectId for Platform Documentation (one group per project), subProjectId for Project Docs/ADRs
-- (one group per sub-project) - so a reindex can wipe-and-replace just its own group's chunks
-- without touching any other group's, in the same project or a different sub-project.
ALTER TABLE documentation_chunks ADD COLUMN owner_id uuid;

-- Existing rows are all Platform Documentation chunks (the only source before this migration),
-- whose owner group is the whole project.
UPDATE documentation_chunks SET owner_id = project_id;

ALTER TABLE documentation_chunks ALTER COLUMN owner_id SET NOT NULL;

CREATE INDEX idx_documentation_chunks_owner_id ON documentation_chunks (owner_id);
