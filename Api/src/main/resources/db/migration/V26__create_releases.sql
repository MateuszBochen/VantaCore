-- Per-project release planning. Same two-table shape as boards/board_projects: a simple mutable
-- aggregate (no versioning/history - one PUT upserts the whole thing) plus an element-collection
-- join table for its assigned tickets.
CREATE TABLE releases (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    planned_release_date date NOT NULL,
    -- No CHECK constraint on status - same reasoning as sprints.status (V19): Hibernate never
    -- updates a hand-written CHECK when the enum gains a value later.
    status character varying(255) NOT NULL,
    version_number character varying(255) NOT NULL
);

ALTER TABLE ONLY releases ADD CONSTRAINT releases_pkey PRIMARY KEY (id);
ALTER TABLE ONLY releases ADD CONSTRAINT fk_releases_project FOREIGN KEY (project_id) REFERENCES projects(id);

CREATE INDEX idx_releases_project_id ON releases (project_id);

-- No FK to tickets: same cross-module reference story as board_projects/sprint_tickets - validated
-- at the application layer (UpsertReleaseCommandHandler), not enforced here.
CREATE TABLE release_tickets (
    release_id uuid NOT NULL,
    ticket_id uuid NOT NULL
);
ALTER TABLE ONLY release_tickets ADD CONSTRAINT fk_release_tickets_release FOREIGN KEY (release_id) REFERENCES releases(id);
