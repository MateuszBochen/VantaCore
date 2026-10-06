CREATE TABLE sprints (
    id uuid NOT NULL,
    board_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    -- No CHECK constraint on status - see project_custom_field_definitions_type_check history
    -- (V2__fix_custom_field_type_check_constraint.sql) for why: Hibernate never updates a
    -- hand-written CHECK when the enum gains a value later.
    status character varying(255) NOT NULL,
    started_at timestamp(6) with time zone,
    started_by_user_id uuid,
    closed_at timestamp(6) with time zone,
    closed_by_user_id uuid,
    report jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE ONLY sprints ADD CONSTRAINT sprints_pkey PRIMARY KEY (id);
ALTER TABLE ONLY sprints ADD CONSTRAINT fk_sprints_board FOREIGN KEY (board_id) REFERENCES boards(id);
ALTER TABLE ONLY sprints ADD CONSTRAINT fk_sprints_started_by FOREIGN KEY (started_by_user_id) REFERENCES users(id);
ALTER TABLE ONLY sprints ADD CONSTRAINT fk_sprints_closed_by FOREIGN KEY (closed_by_user_id) REFERENCES users(id);

CREATE INDEX idx_sprints_board_id ON sprints (board_id);

-- No FK to tickets: same cross-module reference story as board_projects/board_column_statuses
-- (V17__create_boards.sql) - validated at the application layer (UpsertSprintCommandHandler), not
-- enforced here.
CREATE TABLE sprint_tickets (
    sprint_id uuid NOT NULL,
    ticket_id uuid NOT NULL
);
ALTER TABLE ONLY sprint_tickets ADD CONSTRAINT fk_sprint_tickets_sprint FOREIGN KEY (sprint_id) REFERENCES sprints(id);
