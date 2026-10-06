import type {UserTicketLayoutPreference} from '../Type/types';

// Dispatched whenever My Profile's layout picker changes the stored
// preference - same eventBus-sync-without-prop-drilling pattern as
// ThemeChangedEvent (see its own comment): TicketLayoutPreferenceSection and
// every open TicketEditor are siblings deep in different subtrees with no
// shared ancestor state to drill through.
export class TicketLayoutPreferenceChangedEvent {
  constructor(public readonly preference: UserTicketLayoutPreference) {}
}
