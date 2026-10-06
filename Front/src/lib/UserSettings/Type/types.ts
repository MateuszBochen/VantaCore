import type {UserTicketLayoutPreference} from '@/lib/TicketLayout/Type/types';

// The one blob behind GET/PUT /api/user-settings - PUT is a full overwrite,
// not a per-key PATCH (see useSaveUserSettingsHook), so every write has to
// round-trip through whatever's already known about every OTHER key too, or
// it silently wipes them (e.g. saving ticketLayout would erase pageTheme if
// it weren't carried along). Keys this frontend doesn't have a specific
// hook for yet stay as opaque unknowns via the index signature, passed
// through untouched by callers' merges rather than typed out exhaustively
// here.
export type UserSettings = Record<string, unknown> & {
  pageTheme?: unknown;
  ticketLayout?: UserTicketLayoutPreference | null;
};

// GET /api/app-settings' envelope - loaded once at app boot (see App.tsx),
// before the panel router ever renders, so every setting section reads a
// value that's already the saved one instead of flashing a default/local
// value first. `resource.userSettings` is the exact same object PUT
// /api/user-settings takes as its body (see useSaveUserSettingsHook).
export type GetAppSettingsResponse = {
  id: string;
  type: string;
  resource: {
    userSettings: UserSettings;
  };
};

export type GetAppSettingsResult = {success: true; userSettings: UserSettings} | {success: false};

export type SaveUserSettingsResult = {success: true} | {success: false};
