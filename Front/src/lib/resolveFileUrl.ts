import {Settings} from './Settings/Settings';
import {SettingName} from './Settings/Enum/SettingName';

// File paths returned by the API (e.g. a user's avatarUrl:
// "/web-api/file/{id}") are relative to the API host, not the frontend's own
// origin - handing them straight to <img src> resolves them against
// whatever origin the frontend itself is served from, which 404s whenever
// that differs from API_HOST (e.g. the Vite dev server). Already-absolute
// URLs pass through untouched.
const resolveFileUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${Settings.getSetting(SettingName.API_HOST)}${path}`;
};

export default resolveFileUrl;
