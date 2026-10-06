-- Needed for AssignTicketToReleaseVersionCommandHandler's atomic "add one ticket" INSERT ... ON
-- CONFLICT DO NOTHING (see JpaReleaseRepositoryAdapter.addTicket) - without a unique target,
-- ON CONFLICT has nothing to match against. Defensive dedupe first since no such constraint
-- existed before now (a client PUT re-submitting the same ticketIds list could already have
-- created duplicate rows, harmless functionally but would block adding the constraint).
DELETE FROM release_tickets a USING release_tickets b
WHERE a.ctid < b.ctid AND a.release_id = b.release_id AND a.ticket_id = b.ticket_id;

ALTER TABLE release_tickets ADD CONSTRAINT release_tickets_unique UNIQUE (release_id, ticket_id);
