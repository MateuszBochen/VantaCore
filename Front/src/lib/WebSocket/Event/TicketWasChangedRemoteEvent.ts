// Dispatched when the websocket reports that a ticket's core fields changed
// (someone saved it - this tab, another tab, or another user entirely).
// Payload confirmed 2026-08-04: the ticket resource itself, minus
// timeSpent/timeSpentAll/testCases/progress - this event doesn't carry those.
export class TicketWasChangedRemoteEvent {
    constructor(public readonly payload: unknown) {
    }
}
