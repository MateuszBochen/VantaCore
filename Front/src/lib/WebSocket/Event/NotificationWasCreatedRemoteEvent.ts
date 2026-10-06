// Dispatched when the websocket reports a brand-new notification for this
// user. Confirmed 2026-08-20: the envelope's own `payload` field IS the full
// notification resource itself (`{id, type, payload, read, createdAt}`,
// same shape as NotificationSummary/ListNotificationsResponseItem.resource)
// - one level deeper than most other *RemoteEvent payloads here, since this
// message doesn't carry a separate "what changed" object on top of an id.
export class NotificationWasCreatedRemoteEvent {
    constructor(public readonly payload: unknown) {
    }
}
