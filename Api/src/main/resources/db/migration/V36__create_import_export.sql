-- Import connections (Jira/Azure DevOps only - CSV import needs no stored connection) and import
-- jobs (all three providers, always async - see the "Import runs as an async background job" ADR
-- on the Import / Export sub-project).

-- Write-once, like files (FileAggregate) - a connection's token is never edited, only created; the
-- raw token itself is never stored, only its encrypted form (see CredentialEncryptor). Reparenting
-- to another project or rotating the token means creating a new connection, not updating this one.
CREATE TABLE import_connections (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    provider character varying(20) NOT NULL,
    base_url character varying(500) NOT NULL,
    encrypted_token text NOT NULL,
    created_by_user_id uuid,
    created_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY import_connections ADD CONSTRAINT import_connections_pkey PRIMARY KEY (id);
ALTER TABLE ONLY import_connections ADD CONSTRAINT fk_import_connections_project FOREIGN KEY (project_id) REFERENCES projects(id);

CREATE TABLE import_jobs (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    status character varying(20) NOT NULL,
    progress integer NOT NULL DEFAULT 0,
    report jsonb,
    created_by_user_id uuid,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY import_jobs ADD CONSTRAINT import_jobs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY import_jobs ADD CONSTRAINT fk_import_jobs_project FOREIGN KEY (project_id) REFERENCES projects(id);

CREATE INDEX idx_import_jobs_project_created ON import_jobs (project_id, created_at DESC);
