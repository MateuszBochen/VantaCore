// Dispatched when the websocket reports a worklog entry was logged/edited/
// deleted (this tab, another tab, or another user entirely) - confirmed
// 2026-08-19. `date` is the same bare (zoneless) local datetime string as
// everywhere else a worklog entry's start time appears (see dateRange.ts's
// own comment on the convention) - not necessarily present for a delete
// (the backend hasn't confirmed a deleted entry still carries its own
// fields vs. just an id), so listeners should treat anything past
// `id`/`ticketId` as optional.
export type WorklogChangedPayload = {
    id: string;
    ticketId: string;
    minutes?: number;
    date?: string;
    note?: string;
    actorId?: string;
};

export class WorklogWasChangedRemoteEvent {
    constructor(public readonly payload: unknown) {
    }
}
