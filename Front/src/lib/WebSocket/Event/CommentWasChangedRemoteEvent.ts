// Dispatched when the websocket reports an edited comment (this tab,
// another tab, or another user). Payload confirmed 2026-08-04: same shape
// as CommentWasAddedRemoteEvent - {id, ticketId, body, createdAt,
// changedAt, authorId} - changedAt is what actually differs from the
// original add.
export class CommentWasChangedRemoteEvent {
    constructor(public readonly payload: unknown) {
    }
}
