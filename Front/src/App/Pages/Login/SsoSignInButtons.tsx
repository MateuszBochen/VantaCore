import {useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import {KeyRound} from 'lucide-react';
import {Button} from '@/components/ui/button';
import useGetOpenSettingsHook from '../../../lib/OpenSettings/useGetOpenSettingsHook';
import useSsoLoginHook from '../../../lib/Sso/useSsoLoginHook';
import {eventBus} from '../../../lib/EventBus/EventBus';
import {LoginFailedEvent} from '../../../lib/User/Login/Event/LoginFailedEvent';
import type {SsoProviderAvailability} from '../../../lib/OpenSettings/Type/types';
import type {SsoProvider} from '../../../lib/Sso/Type/types';

// Official marks - providers' sign-in button guidelines ask for their own
// logo, which lucide doesn't ship (it dropped brand icons).
const MicrosoftLogo = () => (
  <svg viewBox="0 0 21 21" className="h-4 w-4" aria-hidden>
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
  </svg>
);

// currentColor - GitHub's mark is monochrome, so it follows the button text
// on every theme.
const GitHubLogo = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const PROVIDER_BUTTON: Record<SsoProvider, {label: (entry: SsoProviderAvailability) => string; icon: ReactNode}> = {
  MICROSOFT: {label: () => 'Microsoft', icon: <MicrosoftLogo />},
  GOOGLE: {label: () => 'Google', icon: <GoogleLogo />},
  GITHUB: {label: () => 'GitHub', icon: <GitHubLogo />},
  // "OIDC" means nothing to a user - the admin-set name (e.g. "Okta") does.
  OIDC: {label: (entry) => entry.settings?.displayName || 'Single sign-on', icon: <KeyRound className="h-4 w-4" />},
};

// "Sign in with …" buttons for every enabled SSO provider (Settings → SSO),
// read from the public open settings. Renders nothing while loading, when
// none is enabled, or when the settings can't be loaded - password sign-in
// above works on its own either way. A click asks the Api for the
// provider's sign-in URL and sends the browser there; the provider brings
// it back to /login/sso/{provider} (SsoCallback).
const SsoSignInButtons = () => {
  const {getOpenSettings} = useGetOpenSettingsHook();
  const {startSsoLogin} = useSsoLoginHook();
  const [providers, setProviders] = useState<SsoProviderAvailability[]>([]);
  // The provider whose sign-in is starting - its button spins, the others
  // wait (one redirect at a time).
  const [startingProvider, setStartingProvider] = useState<SsoProvider | null>(null);

  const handleSignIn = (provider: SsoProvider) => {
    setStartingProvider(provider);

    startSsoLogin(provider).then((result) => {
      if (!result.success) {
        setStartingProvider(null);
        eventBus.dispatch(new LoginFailedEvent(result.message));
        return;
      }

      // Leaves the app - the spinner stays until the provider's page loads.
      window.location.assign(result.authorizationUrl);
    });
  };

  useEffect(() => {
    let cancelled = false;

    getOpenSettings().then((result) => {
      if (!cancelled && result.success) {
        setProviders(result.settings.sso.filter((entry) => entry.enabled));
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getOpenSettings is a thin useRequestHook wrapper recreated every render
  }, []);

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-zinc-500">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {providers.map((entry) => {
        const button = PROVIDER_BUTTON[entry.provider];

        return (
          <Button
            key={entry.provider}
            variant="outline"
            leftIcon={button.icon}
            onClick={() => handleSignIn(entry.provider)}
            loading={startingProvider === entry.provider}
            disabled={startingProvider !== null && startingProvider !== entry.provider}
            className="w-full"
          >
            Sign in with {button.label(entry)}
          </Button>
        );
      })}
    </div>
  );
};

export default SsoSignInButtons;
