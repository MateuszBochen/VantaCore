import type {AppTheme} from '../Type/types';

// Dispatched whenever the theme picker changes - Background.tsx and
// UserBadge.tsx are siblings deep in different subtrees (Panel.tsx has no
// single place to hold shared state without prop-drilling through
// WorkPlace.tsx too), so this is how they stay in sync, same eventBus
// pattern already used app-wide (see SidebarLogo's request-activity
// tracking) instead of introducing a context provider just for this.
export class ThemeChangedEvent {
  constructor(public readonly theme: AppTheme) {}
}
