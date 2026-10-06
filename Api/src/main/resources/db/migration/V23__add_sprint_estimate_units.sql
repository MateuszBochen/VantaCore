-- Per-unit rollups (e.g. [{"unit":"SP","value":21}]) rather than one unit-agnostic number, since a
-- board can span multiple projects and each project has its own single estimate_unit (V16). Same
-- jsonb-as-text mapping as sprints.report (V19), default '[]' covers new rows and existing ones alike.
ALTER TABLE sprints ADD COLUMN initial_estimate_unit jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE sprints ADD COLUMN closing_estimate_unit jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE sprints ADD COLUMN actual_estimate_unit jsonb NOT NULL DEFAULT '[]'::jsonb;
