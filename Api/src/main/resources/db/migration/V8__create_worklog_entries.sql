CREATE TABLE worklog_entries (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid NOT NULL,
    minutes integer NOT NULL,
    entry_date date NOT NULL,
    note text,
    created_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY worklog_entries ADD CONSTRAINT worklog_entries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY worklog_entries ADD CONSTRAINT fk_worklog_entries_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id);
ALTER TABLE ONLY worklog_entries ADD CONSTRAINT fk_worklog_entries_user FOREIGN KEY (user_id) REFERENCES users(id);

CREATE INDEX idx_worklog_entries_ticket_id ON worklog_entries (ticket_id);
