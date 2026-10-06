import type {Ticket} from './Type/types';

class TicketCache {
    private static instance: TicketCache;

    private readonly tickets: Map<string, Ticket> = new Map();

    static getInstance = (): TicketCache => {
        if (!TicketCache.instance) {
            TicketCache.instance = new TicketCache();
        }

        return TicketCache.instance;
    }

    private constructor() {
    }

    // Indexed by both id and key (GET .../ticket/:ticketId now accepts
    // either) so a lookup by whichever one the URL currently has hits the
    // cache regardless of which one the ticket was originally fetched/set by.
    get = (idOrKey: string): Ticket | null => {
        return this.tickets.get(idOrKey) ?? null;
    }

    set = (ticket: Ticket): void => {
        this.tickets.set(ticket.id, ticket);

        if (ticket.key) {
            this.tickets.set(ticket.key, ticket);
        }
    }

    // Drops both index entries for a ticket (looked up by either id or key)
    // so the next get() is a guaranteed miss - used when something external
    // (TICKET_CHANGED over the websocket) tells us the cached copy is stale,
    // forcing the next getTicket() to actually hit the network instead of
    // returning what's already in memory.
    delete = (idOrKey: string): void => {
        const ticket = this.tickets.get(idOrKey);

        if (!ticket) {
            this.tickets.delete(idOrKey);
            return;
        }

        this.tickets.delete(ticket.id);

        if (ticket.key) {
            this.tickets.delete(ticket.key);
        }
    }
}

export default TicketCache;

export const ticketCache = TicketCache.getInstance();
