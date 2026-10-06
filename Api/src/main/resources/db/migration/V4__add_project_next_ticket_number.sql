-- Counter backing ticket key generation ({prefix}-{number}). Deliberately NOT mapped as a field on
-- ProjectEntity/ProjectAggregate: that entity is saved as a full replace on every PUT /api/project/{id},
-- so if this counter were a normal mapped column, an unrelated project-settings save (loaded before a
-- concurrent ticket creation) would silently roll it back. It's only ever touched via a single atomic
-- "UPDATE ... SET next_ticket_number = next_ticket_number + 1 ... RETURNING next_ticket_number" statement,
-- issued directly through the JPA EntityManager, bypassing the ProjectEntity mapping entirely.
ALTER TABLE projects ADD COLUMN next_ticket_number integer;

UPDATE projects SET next_ticket_number = COALESCE(starting_number, 1);

ALTER TABLE projects ALTER COLUMN next_ticket_number SET NOT NULL;
ALTER TABLE projects ALTER COLUMN next_ticket_number SET DEFAULT 1;
