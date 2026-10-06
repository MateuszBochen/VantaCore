import type {UserTicketLayoutPreference} from './Type/types';

const STORAGE_KEY = 'ticket-layout-preference';

const DEFAULT_PREFERENCE: UserTicketLayoutPreference = {
  activeSlot: 'default',
  slots: {default: null, devops: null, jira: null, custom: null},
};

// Same validate-or-fall-back-to-default shape as ThemeStorage's own
// getStoredTheme - a stale/foreign/corrupt localStorage value never breaks
// the app, it just resets to the one preference that's always guaranteed
// valid (default slot, no per-slot edits yet). This is only the optimistic
// cache in front of GET/PUT /api/user-settings/ticket-layout - see
// useTicketLayoutPreference for how the backend value takes over.
export const getStoredTicketLayoutPreference = (): UserTicketLayoutPreference => {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return DEFAULT_PREFERENCE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserTicketLayoutPreference>;

    if (
      typeof parsed.activeSlot === 'string' &&
      ['default', 'devops', 'jira', 'custom'].includes(parsed.activeSlot) &&
      typeof parsed.slots === 'object' &&
      parsed.slots !== null
    ) {
      return {
        activeSlot: parsed.activeSlot as UserTicketLayoutPreference['activeSlot'],
        slots: {...DEFAULT_PREFERENCE.slots, ...parsed.slots},
      };
    }
  } catch {
    // Corrupt/foreign value under this key - fall back to the default below.
  }

  return DEFAULT_PREFERENCE;
};

export const setStoredTicketLayoutPreference = (preference: UserTicketLayoutPreference): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
};
