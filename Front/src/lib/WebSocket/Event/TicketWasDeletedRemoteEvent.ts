// Dispatched when the websocket reports a deleted ticket (this tab, another
// tab, or another user). Payload confirmed from TicketWasDeletedWebSocketHandler.java
// / TicketWasDeleted.java: {ticketId, projectId, ticketKey} - id-only, there's
// no "new state" to merge, just something to remove from wherever it's showing.
export class TicketWasDeletedRemoteEvent {
    constructor(public readonly payload: unknown) {
    }
}
