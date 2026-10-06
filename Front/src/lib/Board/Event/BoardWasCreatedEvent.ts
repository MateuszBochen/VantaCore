import type {Board} from '../Type/types';

// No toast - same convention as ProjectWasCreatedEvent (see
// ToastEventSubscriber.ts, which doesn't register this one). Purely for the
// sidebar to append the new board to its live list without refetching.
export class BoardWasCreatedEvent {
    constructor(public readonly board: Board) {
    }
}
