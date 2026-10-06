-- One row appended on every ticket save (creation included), same "every write is a version" idea as
-- sub_project_versions - but unlike that table, tickets.id itself stays stable (worklog_entries/
-- comments/test_cases already carry FKs to it), so this is a separate append-only log instead of
-- tickets itself becoming multi-row. "Current" state is just the live tickets row; this table only
-- needs to answer "what did it look like before some point in time".
CREATE TABLE ticket_history (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    changed_by_user_id uuid,
    changed_by_email character varying(255),
    changed_at timestamp(6) with time zone NOT NULL,
    snapshot jsonb NOT NULL
);

ALTER TABLE ONLY ticket_history ADD CONSTRAINT ticket_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY ticket_history ADD CONSTRAINT fk_ticket_history_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id);

CREATE INDEX idx_ticket_history_ticket_id_changed_at ON ticket_history (ticket_id, changed_at DESC);
