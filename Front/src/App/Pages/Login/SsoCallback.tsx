import {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import Background from '../../../components/layout/Background.tsx';
import Link from '../../../components/ui/Link.tsx';
import AuthCard from './AuthCard.tsx';
import AuthHeader from './AuthHeader.tsx';
import AuthFeedback from './AuthFeedback.tsx';
import useSsoLoginHook from '../../../lib/Sso/useSsoLoginHook';
import parseSsoProvider from '../../../lib/Sso/parseSsoProvider';
import {eventBus} from '../../../lib/EventBus/EventBus';
import {UserLoggedInEvent} from '../../../lib/Auth/Event/UserLoggedInEvent';

const REDIRECT_DELAY_MS = 700;

// Where a provider sends the browser back after sign-in (the Redirect URI
// shown in Settings → SSO): /login/sso/{provider}?code=…&state=…, or
// ?error=… when the user cancelled / the provider refused. Posts code+state
// to the Api in the background and, on success, finishes exactly like a
// password login (same token storage, same UserLoggedInEvent).
const SsoCallback = () => {
  const {provider: providerParam} = useParams<{provider: string}>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {completeSsoLogin} = useSsoLoginHook();
  const [state, setState] = useState<'scanning' | 'success' | 'error'>('scanning');
  const [message, setMessage] = useState('');
  // The code is single-use - React's dev double-run of effects would
  // otherwise post it twice and the second call would fail as "invalid
  // state", flashing an error over a sign-in that actually worked.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    const provider = parseSsoProvider(providerParam);
    const code = searchParams.get('code');
    const oauthState = searchParams.get('state');
    // Deferred a tick: setting state synchronously in an effect body isn't
    // allowed here - only the async outcome may set it.
    const fail = (text: string) =>
      Promise.resolve().then(() => {
        setMessage(text);
        setState('error');
      });

    if (!provider) {
      void fail('Unknown sign-in provider.');
      return;
    }

    if (searchParams.get('error')) {
      void fail(searchParams.get('error') === 'access_denied' ? 'Sign-in was cancelled.' : 'The provider refused the sign-in - please try again.');
      return;
    }

    if (!code || !oauthState) {
      void fail('This sign-in link is incomplete - please start again.');
      return;
    }

    completeSsoLogin(provider, code, oauthState).then((result) => {
      if (!result.success) {
        setMessage(result.message);
        setState('error');
        return;
      }

      setState('success');
      setTimeout(() => {
        // Drop /login/sso/…?code=… from the address bar - the panel starts
        // on the dashboard, and the used code shouldn't linger in history.
        // Logged-in first: both updates land in one render, straight to
        // AuthLoadingScreen - navigating first rendered the Login form for a
        // frame in between.
        eventBus.dispatch(new UserLoggedInEvent());
        navigate('/', {replace: true});
      }, REDIRECT_DELAY_MS);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on arrival, guarded by `started`
  }, []);

  return (
    <Background>
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <AuthCard state={state}>
          <AuthHeader subtitle="SINGLE SIGN-ON" />

          {state === 'scanning' && <p className="text-center text-sm text-zinc-400">Signing you in…</p>}

          <AuthFeedback state={state} messageSuccess="ACCESS GRANTED – INITIALIZING VantaCore…" messageError={message} />

          {state === 'error' && (
            <div className="mt-6 flex justify-center text-xs text-zinc-400">
              <Link to="/">
                <span className="flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </span>
              </Link>
            </div>
          )}
        </AuthCard>
      </div>
    </Background>
  );
};

export default SsoCallback;
