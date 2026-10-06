// Dispatched when the websocket reports that work started on some ticket
// (this user's Play button, on this tab or another one) - payload shape
// isn't confirmed with the backend yet (see WebSocketService's
// WORKLOG_STARTED_KEY), so this carries it as-is and lets listeners extract
// whatever fields they can find defensively. Only one timer is allowed to
// run per user at a time, so a listener whose own timer is running for a
// *different* ticket than this event's should treat it as "stop and commit
// mine" - see TicketWorklogStopwatch.
export class WorklogWasStartedRemoteEvent {
    constructor(public readonly payload: unknown) {
    }
}
