import {useEffect, useState} from 'react';
import {eventBus} from '@/lib/EventBus/EventBus';
import {userSettingsCache} from '@/lib/UserSettings/UserSettingsCache';
import useGetAppSettingsHook from '@/lib/UserSettings/useGetAppSettingsHook';
import useSaveUserSettingsHook from '@/lib/UserSettings/useSaveUserSettingsHook';
import type {UserSettings} from '@/lib/UserSettings/Type/types';
import {getStoredTicketLayoutPreference, setStoredTicketLayoutPreference} from './TicketLayoutPreferenceStorage';
import {TicketLayoutPreferenceChangedEvent} from './Event/TicketLayoutPreferenceChangedEvent';
import type {UserTicketLayoutPreference} from './Type/types';

// Same shape as lib/Theme/useAppTheme.ts - state initializes from
// localStorage (instant, no flash), then stays in sync via
// TicketLayoutPreferenceChangedEvent so changing it in My Profile is
// reflected in every open TicketEditor without prop-drilling or a page
// reload. localStorage is an optimistic cache in front of UserSettingsCache
// (the shared GET /api/app-settings / PUT /api/user-settings blob): App.tsx
// already populates that cache once at boot, before the panel router (and
// so every consumer of this hook) ever mounts, so the effect below normally
// just reads the cache straight through with no network call of its own -
// it only falls back to its own GET if that boot fetch failed or the cache
// is otherwise empty.
//
// PUT /api/user-settings is a full overwrite of the whole settings blob
// (pageTheme, ticketLayout, ...), not a per-key PATCH - a save here has to
// merge `next` into the LATEST known full blob (from cache, or awaiting
// whatever fetch is already in flight) before sending it, or it would wipe
// out every other setting (e.g. pageTheme) that isn't ticketLayout.
const useTicketLayoutPreference = () => {
  const [preference, setPreferenceState] = useState<UserTicketLayoutPreference>(getStoredTicketLayoutPreference);
  const {getAppSettings} = useGetAppSettingsHook();
  const {saveUserSettings} = useSaveUserSettingsHook();

  useEffect(() => {
    const handleChanged = (event: TicketLayoutPreferenceChangedEvent) => setPreferenceState(event.preference);
    eventBus.subscribe<TicketLayoutPreferenceChangedEvent>(TicketLayoutPreferenceChangedEvent.name, handleChanged);

    return () => {
      eventBus.unsubscribe<TicketLayoutPreferenceChangedEvent>(TicketLayoutPreferenceChangedEvent.name, handleChanged);
    };
  }, []);

  useEffect(() => {
    const applyRemote = (settings: UserSettings) => {
      if (settings.ticketLayout) {
        setStoredTicketLayoutPreference(settings.ticketLayout);
        eventBus.dispatch(new TicketLayoutPreferenceChangedEvent(settings.ticketLayout));
      }
    };

    const cached = userSettingsCache.get();

    if (cached) {
      applyRemote(cached);
      return;
    }

    let cancelled = false;
    let pending = userSettingsCache.getPending();

    if (!pending) {
      pending = getAppSettings().then((result) => {
        const loaded = result.success ? result.userSettings : {};
        userSettingsCache.set(loaded);
        userSettingsCache.setPending(null);
        return loaded;
      });
      userSettingsCache.setPending(pending);
    }

    pending.then((loaded) => {
      if (!cancelled) {
        applyRemote(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getAppSettings is a thin useRequestHook wrapper recreated every render; the cache guard above prevents refetching once loaded
  }, []);

  const setPreference = (next: UserTicketLayoutPreference) => {
    setStoredTicketLayoutPreference(next);
    eventBus.dispatch(new TicketLayoutPreferenceChangedEvent(next));

    const cached = userSettingsCache.get();
    const basePromise: Promise<UserSettings> = cached
      ? Promise.resolve(cached)
      : (userSettingsCache.getPending() ?? getAppSettings().then((result) => (result.success ? result.userSettings : {})));

    void basePromise.then((base) => {
      const merged: UserSettings = {...base, ticketLayout: next};
      userSettingsCache.set(merged);
      void saveUserSettings(merged);
    });
  };

  return {preference, setPreference};
};

export default useTicketLayoutPreference;
