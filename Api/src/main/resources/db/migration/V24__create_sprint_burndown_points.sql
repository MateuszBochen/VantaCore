-- One row per (sprint, estimate unit, day) - "remaining" work as of that day. Recorded once daily
-- by a scheduled job (SprintBurndownScheduler) as a fallback, and immediately whenever a relevant
-- ticket change happens while the sprint is ACTIVE (see SprintBurndownRecorder) - the unique
-- constraint is what makes an upsert (ON CONFLICT) possible from either trigger without racing.
CREATE TABLE sprint_burndown_points (
    id uuid NOT NULL,
    sprint_id uuid NOT NULL,
    unit character varying(255) NOT NULL,
    date date NOT NULL,
    remaining double precision NOT NULL
);

ALTER TABLE ONLY sprint_burndown_points ADD CONSTRAINT sprint_burndown_points_pkey PRIMARY KEY (id);
ALTER TABLE ONLY sprint_burndown_points ADD CONSTRAINT sprint_burndown_points_unique UNIQUE (sprint_id, unit, date);
ALTER TABLE ONLY sprint_burndown_points ADD CONSTRAINT fk_sprint_burndown_points_sprint FOREIGN KEY (sprint_id) REFERENCES sprints(id);
