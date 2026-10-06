-- Deliberately NOT mapped as fields on TicketEntity/TicketAggregate, for the same reason as
-- projects.next_ticket_number (see V4): TicketAggregate is saved as a full replace on every
-- PUT .../ticket/{id}, so a normal mapped column would get silently rolled back to a stale value by
-- an unrelated ticket edit racing a worklog entry. These are only ever touched via single atomic
-- "UPDATE ... SET x = x + ? WHERE id = ?" statements, issued directly through the JPA EntityManager.
ALTER TABLE tickets ADD COLUMN time_spent integer NOT NULL DEFAULT 0;
ALTER TABLE tickets ADD COLUMN time_spent_all integer NOT NULL DEFAULT 0;
