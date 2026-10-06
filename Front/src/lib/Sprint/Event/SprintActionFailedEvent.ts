// Shared error-toast event for the start/close actions (distinct from
// SprintSaveFailedEvent, which is specifically about the PUT/save call).
export class SprintActionFailedEvent {
    constructor(public readonly message: string) {
    }
}
