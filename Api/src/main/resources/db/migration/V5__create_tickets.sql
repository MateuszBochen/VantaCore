CREATE TABLE tickets (
    id uuid NOT NULL,
    key character varying(255) NOT NULL,
    project_id uuid NOT NULL,
    sub_project_id uuid,
    issue_type_id uuid,
    status_id uuid,
    parent_id uuid,
    title character varying(255),
    description text,
    priority integer,
    custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE ONLY tickets ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);
-- key is only unique within a project, not globally (two projects both number from their own prefix).
ALTER TABLE ONLY tickets ADD CONSTRAINT tickets_project_id_key_key UNIQUE (project_id, key);
ALTER TABLE ONLY tickets ADD CONSTRAINT fk_tickets_project FOREIGN KEY (project_id) REFERENCES projects(id);

-- issue_type_id/status_id/parent_id intentionally have no FK: like project_automation_rules'
-- parent_type_id/set_parent_status_id, they're cross-references validated at the application layer
-- (ticket policy against the owning project's catalog), not enforced in the schema.

CREATE TABLE ticket_assignees (
    ticket_id uuid NOT NULL,
    user_id uuid NOT NULL
);
ALTER TABLE ONLY ticket_assignees ADD CONSTRAINT fk_ticket_assignees_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id);

CREATE TABLE ticket_flags (
    ticket_id uuid NOT NULL,
    flag_id uuid NOT NULL
);
ALTER TABLE ONLY ticket_flags ADD CONSTRAINT fk_ticket_flags_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id);

CREATE TABLE ticket_tags (
    ticket_id uuid NOT NULL,
    tag character varying(255) NOT NULL
);
ALTER TABLE ONLY ticket_tags ADD CONSTRAINT fk_ticket_tags_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id);

CREATE TABLE ticket_related_tickets (
    ticket_id uuid NOT NULL,
    related_ticket_id uuid NOT NULL
);
ALTER TABLE ONLY ticket_related_tickets ADD CONSTRAINT fk_ticket_related_tickets_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id);
