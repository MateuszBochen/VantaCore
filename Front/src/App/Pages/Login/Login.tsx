import {useCallback, useRef, useState} from 'react';
import { Fingerprint, Lock, CircleUserRoundIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Background from '../../../components/layout/Background.tsx';
import Link from '../../../components/ui/Link.tsx';
import AuthCard from './AuthCard.tsx';
import AuthHeader from './AuthHeader.tsx';
import AuthFeedback from './AuthFeedback.tsx';
import SsoSignInButtons from './SsoSignInButtons.tsx';
import LoginForm from '../../Form/LoginForm/LoginForm.tsx';
import type {LoginFormData, LoginFormRef} from '../../Form/LoginForm/types.ts';
import useLoginHook from '../../../lib/User/Login/useLoginHook';
import {eventBus} from '../../../lib/EventBus/EventBus';
import {LoginFailedEvent} from '../../../lib/User/Login/Event/LoginFailedEvent';
import {UserLoggedInEvent} from '../../../lib/Auth/Event/UserLoggedInEvent';

const REDIRECT_DELAY_MS = 700;

const SERVER_FIELD_TO_FORM_FIELD: Record<string, string> = {
  email: 'username',
  password: 'password',
};

const Login = () => {
  const loginFormRef = useRef<LoginFormRef>(null);

  const [state, setState] = useState<"idle" | "scanning" | "error" | "success">("idle");
  const {login} = useLoginHook();

  const authenticate = useCallback(async (data: LoginFormData) => {
    setState("scanning");

    try {
      const result = await login({email: data.username, password: data.password});

      if (result.success) {
        setState("success");
        setTimeout(() => eventBus.dispatch(new UserLoggedInEvent()), REDIRECT_DELAY_MS);
        return;
      }

      setState("error");

      const fieldErrors: {field: string; message: string}[] = [];

      result.errors.forEach((error) => {
        const serverField = error.resource.code.split('.').slice(1).join('.');
        const formField = SERVER_FIELD_TO_FORM_FIELD[serverField];

        if (formField) {
          fieldErrors.push({field: formField, message: error.resource.message});
          return;
        }

        eventBus.dispatch(new LoginFailedEvent(error.resource.message));
      });

      loginFormRef.current?.setFieldErrors(fieldErrors);
    } catch (error) {
      console.error('Failed to authenticate', error);
      setState("error");
      eventBus.dispatch(new LoginFailedEvent('Nie udało się zalogować'));
    }
  }, [login]);

  const submitLogin = useCallback(() => {
    if (loginFormRef && loginFormRef?.current) {
      loginFormRef.current.submit();
    }
  }, [loginFormRef])

  return (
    <Background>
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <AuthCard state={state}>
          <AuthHeader subtitle="AUTHORIZATION REQUIRED" />
          {/* FORM */}
          <div className="space-y-6">
            <LoginForm
              ref={loginFormRef}
              onSubmit={authenticate}
              lockForm={state === 'scanning'}
            />
          </div>
          <AuthFeedback
            state={state}
            messageSuccess="ACCESS GRANTED – INITIALIZING VantaCore…"
            messageError="ACCESS DENIED – INVALID USER SIGNATURE"
          />

          <div className="mt-10">
            <Button
              type="submit"
              loading={state === "scanning"}
              leftIcon={<Fingerprint className="h-4 w-4" />}
              onClick={submitLogin}
              className="relative w-full overflow-hidden bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black font-semibold"
            >
              {state === "scanning" ? "SCANNING BIOMETRICS" : "Authenticate"}
            </Button>
          </div>

          <SsoSignInButtons />

          <div className="mt-6 flex justify-center gap-6 text-xs text-zinc-400">
            <Link to="/registration">
              <span className="flex items-center gap-1"><CircleUserRoundIcon className="h-3 w-3" />Registration</span>
            </Link>
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> quantum lock</span>
          </div>

        </AuthCard>
      </div>
    </Background>
  );
}

export default Login;
