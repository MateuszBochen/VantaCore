import type {TicketSummary} from './Type/types';

// Removes the matching entry from an existing TicketSummary list for a
// TICKET_DELETED websocket payload - same list-patching convention as
// applyTicketChangedPayload, used by TicketsPage (root list) and TicketRow
// (lazily-loaded children) so a ticket deleted elsewhere disappears without a
// full refetch (which would also collapse whatever rows the user had
// expanded). Payload key is `ticketId`, not `id` - see TicketWasDeleted.java.
// Returns the same array reference when nothing matches, so callers can
// setState without an extra re-render.
const applyTicketDeletedPayload = (tickets: TicketSummary[], payload: unknown): TicketSummary[] => {
  if (typeof payload !== 'object' || payload === null) {
    return tickets;
  }

  const ticketId = (payload as Record<string, unknown>).ticketId;

  if (typeof ticketId !== 'string') {
    return tickets;
  }

  const next = tickets.filter((ticket) => ticket.id !== ticketId);

  return next.length === tickets.length ? tickets : next;
};

export default applyTicketDeletedPayload;
