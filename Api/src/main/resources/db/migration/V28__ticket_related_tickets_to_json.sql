-- relatedTicketIds (a plain Set<UUID>) becomes relatedTickets (Set<{relatedTicketId, type}>), so
-- the old ticket_related_tickets join table (no type column) is replaced by a jsonb column on
-- tickets itself - same storage shape TicketEntity already uses for customFields.
ALTER TABLE tickets ADD COLUMN related_tickets jsonb NOT NULL DEFAULT '[]';

-- Backfill: every existing link becomes RELATES_TO (the only type that existed before this
-- feature), and made symmetric on both sides - the old table let one ticket list another without
-- the reverse being true, but relations are meant to be bidirectional going forward, so a
-- one-sided legacy link is topped up with its missing reverse rather than left inconsistent.
UPDATE tickets t
SET related_tickets = COALESCE((
    SELECT jsonb_agg(jsonb_build_object('relatedTicketId', related_id, 'type', 'RELATES_TO'))
    FROM (
        SELECT related_ticket_id AS related_id FROM ticket_related_tickets WHERE ticket_id = t.id
        UNION
        SELECT ticket_id AS related_id FROM ticket_related_tickets WHERE related_ticket_id = t.id
    ) all_related
), '[]'::jsonb);

DROP TABLE ticket_related_tickets;
