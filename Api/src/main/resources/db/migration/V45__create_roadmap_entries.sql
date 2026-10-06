-- Roadmap - a cross-project planning view, not owned by a single project the way boards/sprints
-- are (see GET /api/roadmap-entry having no /project/{projectId} prefix). One row per ticket
-- placed on the roadmap; PUT .../roadmap-entry/{id} upserts by client-generated id, so adding a
-- ticket and replanning it are the same write path (see RoadmapEntryAggregate).
CREATE TABLE roadmap_entries (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    project_id uuid NOT NULL,
    planned_start date NOT NULL,
    planned_end date NOT NULL
);

ALTER TABLE ONLY roadmap_entries ADD CONSTRAINT roadmap_entries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY roadmap_entries ADD CONSTRAINT fk_roadmap_entries_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id);
ALTER TABLE ONLY roadmap_entries ADD CONSTRAINT fk_roadmap_entries_project FOREIGN KEY (project_id) REFERENCES projects(id);

CREATE INDEX idx_roadmap_entries_project_id ON roadmap_entries (project_id);
