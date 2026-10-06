-- Replaces per-issue-type-owned statuses with a project-level shared pool, referenced by each issue
-- type's own workflow (which statuses it uses + its own transitions between them) - see the "Status
-- & Workflow Model" sub-project's ADRs for why.
--
-- project_issue_type_statuses.id was already a globally-unique UUID per row, never reused across
-- issue types even when two types had a same-named "Done" - so this migration is purely a
-- reparenting (issue_type-owned -> project-owned) plus splitting workflow (transitions) out into its
-- own per-issue-type table. No id is regenerated, so tickets.status_id, board_column_statuses and
-- any AutomationEngineRule trigger/action referencing a statusId all keep meaning exactly what they
-- meant before - nothing there needs rewriting.

ALTER TABLE project_issue_type_statuses RENAME TO project_statuses;

ALTER TABLE project_statuses ADD COLUMN project_id uuid;

UPDATE project_statuses ps SET project_id = pit.project_id
    FROM project_issue_types pit WHERE pit.id = ps.issue_type_id;

ALTER TABLE project_statuses ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE project_statuses ADD CONSTRAINT fk_project_statuses_project FOREIGN KEY (project_id) REFERENCES projects(id);

-- Which shared statuses each issue type uses - the old status row's own (issue_type_id, id) pair
-- becomes exactly one workflow step here, id-preserving (see header comment).
CREATE TABLE project_issue_type_workflow_steps (
    id uuid NOT NULL,
    issue_type_id uuid NOT NULL,
    status_id uuid NOT NULL
);

ALTER TABLE ONLY project_issue_type_workflow_steps ADD CONSTRAINT project_issue_type_workflow_steps_pkey PRIMARY KEY (id);
ALTER TABLE ONLY project_issue_type_workflow_steps ADD CONSTRAINT fk_workflow_steps_issue_type FOREIGN KEY (issue_type_id) REFERENCES project_issue_types(id);
ALTER TABLE ONLY project_issue_type_workflow_steps ADD CONSTRAINT fk_workflow_steps_status FOREIGN KEY (status_id) REFERENCES project_statuses(id);

INSERT INTO project_issue_type_workflow_steps (id, issue_type_id, status_id)
SELECT gen_random_uuid(), issue_type_id, id FROM project_statuses;

-- Transitions move from being keyed by the (now shared, ambiguous across types) status_id to being
-- keyed by the per-issue-type workflow_step - two types sharing the same status can now have
-- different transitions out of it.
CREATE TABLE project_workflow_step_transitions (
    workflow_step_id uuid NOT NULL,
    target_status_id uuid
);

ALTER TABLE ONLY project_workflow_step_transitions ADD CONSTRAINT fk_workflow_step_transitions_step FOREIGN KEY (workflow_step_id) REFERENCES project_issue_type_workflow_steps(id);

INSERT INTO project_workflow_step_transitions (workflow_step_id, target_status_id)
SELECT ws.id, t.target_status_id
FROM project_status_transitions t
JOIN project_issue_type_workflow_steps ws ON ws.status_id = t.status_id;

DROP TABLE project_status_transitions;

-- issue_type_id no longer means ownership - project_issue_type_workflow_steps is now the only place
-- issue-type <-> status linkage lives.
ALTER TABLE project_statuses DROP CONSTRAINT fkht1vhdumiqjp4t3nx146pu8xb;
ALTER TABLE project_statuses DROP COLUMN issue_type_id;
