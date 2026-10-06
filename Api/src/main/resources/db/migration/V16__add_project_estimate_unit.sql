-- Free text - unit meaning is a team/project convention (SP, MD, h, days, ...), not enforced here,
-- same as the ticket-level estimate field itself being unit-agnostic.
ALTER TABLE projects ADD COLUMN estimate_unit character varying(255);
