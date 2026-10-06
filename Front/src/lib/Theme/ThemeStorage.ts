import type {AppTheme} from './Type/types';

const STORAGE_KEY = 'app-theme';
const DEFAULT_THEME: AppTheme = 'neon-blaster';
const VALID_THEMES: AppTheme[] = ['neon-blaster', 'light', 'dark'];

// Same validate-or-fall-back-to-default shape as Sidebar.tsx's own
// readStoredWidth - a stale/foreign localStorage value never breaks the app,
// it just resets to the one theme that's always guaranteed to exist.
export const getStoredTheme = (): AppTheme => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return VALID_THEMES.includes(stored as AppTheme) ? (stored as AppTheme) : DEFAULT_THEME;
};

export const setStoredTheme = (theme: AppTheme): void => {
  localStorage.setItem(STORAGE_KEY, theme);
};
