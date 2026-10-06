import {useEffect, useState} from 'react';
import {eventBus} from '../EventBus/EventBus';
import {getStoredTheme, setStoredTheme} from './ThemeStorage';
import {ThemeChangedEvent} from './Event/ThemeChangedEvent';
import type {AppTheme} from './Type/types';

// Every component that needs the live theme (Background.tsx to render it,
// UserBadge.tsx to offer the picker) calls this independently - state
// initializes from localStorage, then stays in sync via ThemeChangedEvent
// so switching in one place is reflected everywhere without prop-drilling.
const useAppTheme = () => {
  const [theme, setThemeState] = useState<AppTheme>(getStoredTheme);

  useEffect(() => {
    const handleThemeChanged = (event: ThemeChangedEvent) => setThemeState(event.theme);
    eventBus.subscribe<ThemeChangedEvent>(ThemeChangedEvent.name, handleThemeChanged);

    return () => {
      eventBus.unsubscribe<ThemeChangedEvent>(ThemeChangedEvent.name, handleThemeChanged);
    };
  }, []);

  const setTheme = (next: AppTheme) => {
    setStoredTheme(next);
    eventBus.dispatch(new ThemeChangedEvent(next));
  };

  return {theme, setTheme};
};

export default useAppTheme;
