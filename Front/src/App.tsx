import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import LoggedOutRouter from './App/Pages/Login';
import LoggedInRouter from './App/Pages/Panel';
import ToastContainer from './components/ui/ToastContainer.tsx';
import AuthLoadingScreen from './App/Pages/Login/AuthLoadingScreen.tsx';
import JwtManager from './lib/Jwt/JwtManager';
import { eventBus } from './lib/EventBus/EventBus';
import { UserLoggedInEvent } from './lib/Auth/Event/UserLoggedInEvent';
import { UserLoggedOutEvent } from './lib/Auth/Event/UserLoggedOutEvent';
import { userSettingsCache } from './lib/UserSettings/UserSettingsCache';
import useGetAppSettingsHook from './lib/UserSettings/useGetAppSettingsHook';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => JwtManager.getInstance().jwtIsValid());
  // Gates the swap to LoggedInRouter on GET /api/app-settings actually
  // having settled (success OR failure - a failed fetch still unblocks, it
  // just leaves userSettingsCache empty and every setting falls back to its
  // own local default, same as before this existed) - both right after a
  // fresh login and on a page refresh while already logged in, so nothing
  // in the panel (theme, ticket layout, ...) ever flashes its default
  // before snapping to the saved value. Login.tsx's own screen just stays
  // up a little longer while this is in flight.
  const [settingsReady, setSettingsReady] = useState(false);
  const { getAppSettings } = useGetAppSettingsHook();

  useEffect(() => {
    const handleLoggedIn = () => setIsLoggedIn(true);
    const handleLoggedOut = () => {
      setIsLoggedIn(false);
      setSettingsReady(false);
    };

    eventBus.subscribe<UserLoggedInEvent>(UserLoggedInEvent.name, handleLoggedIn);
    eventBus.subscribe<UserLoggedOutEvent>(UserLoggedOutEvent.name, handleLoggedOut);

    return () => {
      eventBus.unsubscribe<UserLoggedInEvent>(UserLoggedInEvent.name, handleLoggedIn);
      eventBus.unsubscribe<UserLoggedOutEvent>(UserLoggedOutEvent.name, handleLoggedOut);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let cancelled = false;

    getAppSettings().then((result) => {
      if (cancelled) {
        return;
      }

      if (result.success) {
        userSettingsCache.set(result.userSettings);
      }

      setSettingsReady(true);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getAppSettings is a thin useRequestHook wrapper recreated every render
  }, [isLoggedIn]);

  // isLoggedIn but settings not yet ready is only ever "logged in, still
  // waiting" (a fresh login or a refresh with an already-valid JWT) - it
  // must NOT fall through to LoggedOutRouter, which renders Login.tsx itself
  // (its own routes match every path, including whatever panel URL the user
  // was actually on). That was the real bug: on refresh, the already-valid
  // session briefly rendered the full login screen while GET /api/app-settings
  // was still in flight (real user feedback 2026-09-01: "na moment pojawia
  // mi sie ekran logowania"). A plain themed blank/spinner here reads as a
  // brief loading beat instead of a spurious logout. AuthLoadingScreen keeps
  // the login screens' own Background + card up meanwhile - a bare
  // `bg-background` here resolved to the :root shadcn default (white, no
  // data-theme outside Background) and flashed between the login card and
  // the panel (most visibly after an SSO sign-in).
  const renderRoot = () => {
    if (!isLoggedIn) {
      return <LoggedOutRouter />;
    }

    if (!settingsReady) {
      return <AuthLoadingScreen />;
    }

    return <LoggedInRouter />;
  };

  return (
    <BrowserRouter>
      {renderRoot()}
      <ToastContainer />
    </BrowserRouter>
  );
}