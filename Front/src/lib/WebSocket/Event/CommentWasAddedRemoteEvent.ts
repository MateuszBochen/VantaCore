// Dispatched when the websocket reports a new comment (this tab, another
// tab, or another user). Payload confirmed 2026-08-04: {id, ticketId, body,
// createdAt, changedAt, authorId} - the same shape as Comment plus ticketId,
// needed here since a websocket message isn't scoped by URL the way a fetch
// is (see TicketCommentsSection, which only acts on this when the payload's
// ticketId matches the ticket it's currently showing).
export class CommentWasAddedRemoteEvent {
    constructor(public readonly payload: unknown) {
    }
}
