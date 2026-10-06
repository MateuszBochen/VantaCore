// Dispatched when the websocket reports a deleted comment (this tab,
// another tab, or another user). Payload confirmed 2026-08-04:
// {ticketId, commentId}.
export class CommentWasDeletedRemoteEvent {
    constructor(public readonly payload: unknown) {
    }
}
