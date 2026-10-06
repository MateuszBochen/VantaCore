import type {UserSettings} from './Type/types';

// Same shape as UsersCache - caches the one GET /api/user-settings result
// for the whole session so every setting section that reads/writes this
// blob (ticket layout today, theme potentially later) shares a single fetch
// instead of each one re-requesting it, and so a save from one section can
// merge against the latest known value of every other section instead of
// clobbering them (see UserSettings' own comment).
class UserSettingsCache {
  private static instance: UserSettingsCache;

  private settings: UserSettings | null = null;

  private pending: Promise<UserSettings> | null = null;

  static getInstance = (): UserSettingsCache => {
    if (!UserSettingsCache.instance) {
      UserSettingsCache.instance = new UserSettingsCache();
    }

    return UserSettingsCache.instance;
  };

  private constructor() {}

  get = (): UserSettings | null => {
    return this.settings;
  };

  set = (settings: UserSettings): void => {
    this.settings = settings;
  };

  getPending = (): Promise<UserSettings> | null => {
    return this.pending;
  };

  setPending = (pending: Promise<UserSettings> | null): void => {
    this.pending = pending;
  };
}

export default UserSettingsCache;

export const userSettingsCache = UserSettingsCache.getInstance();
