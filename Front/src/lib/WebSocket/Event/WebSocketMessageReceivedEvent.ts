// Dispatched for every message the websocket connection receives, on top of
// (not instead of) the specific typed event routed for it (TicketWasCreated-
// RemoteEvent etc.) - generic "there was WS input activity just now" signal
// for UI that just wants a pulse (see SidebarLogo), not the message itself.
// No equivalent "sent" event exists yet - WebSocketService is receive-only
// right now, nothing in the app ever calls socket.send().
export class WebSocketMessageReceivedEvent {
}
