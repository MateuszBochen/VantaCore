// Dispatched when the websocket reports that some other user created a
// ticket - payload shape isn't confirmed with the backend yet (see
// WebSocketService's TICKET_CREATED_KEY), so this carries it as-is and lets
// listeners extract whatever fields they can find defensively.
export class TicketWasCreatedRemoteEvent {
    constructor(public readonly payload: unknown) {
    }
}
