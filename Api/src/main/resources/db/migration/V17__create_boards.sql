CREATE TABLE boards (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    allow_edit_ticket_in_active_sprint boolean NOT NULL DEFAULT false,
    allow_change_estimate_in_active_sprint boolean NOT NULL DEFAULT false,
    allow_add_ticket_to_active_sprint boolean NOT NULL DEFAULT false,
    allow_remove_ticket_from_active_sprint boolean NOT NULL DEFAULT false
);

ALTER TABLE ONLY boards ADD CONSTRAINT boards_pkey PRIMARY KEY (id);

-- No FK to projects: a board references many projects and outlives any single one of them being
-- looked up here, same reasoning as tickets.issue_type_id/status_id being unenforced at the schema
-- level - validated at the application layer instead (CreateBoardCommandHandler).
CREATE TABLE board_projects (
    board_id uuid NOT NULL,
    project_id uuid NOT NULL
);
ALTER TABLE ONLY board_projects ADD CONSTRAINT fk_board_projects_board FOREIGN KEY (board_id) REFERENCES boards(id);

CREATE TABLE board_columns (
    id uuid NOT NULL,
    board_id uuid,
    name character varying(255),
    color character varying(255),
    column_order integer NOT NULL
);

ALTER TABLE ONLY board_columns ADD CONSTRAINT board_columns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY board_columns ADD CONSTRAINT fk_board_columns_board FOREIGN KEY (board_id) REFERENCES boards(id);

-- statusIds are drawn from whichever project's issue-type catalog the board's columns were built
-- against - same cross-module reference story as board_projects, not enforced here either.
CREATE TABLE board_column_statuses (
    column_id uuid NOT NULL,
    status_id uuid NOT NULL
);
ALTER TABLE ONLY board_column_statuses ADD CONSTRAINT fk_board_column_statuses_column FOREIGN KEY (column_id) REFERENCES board_columns(id);
