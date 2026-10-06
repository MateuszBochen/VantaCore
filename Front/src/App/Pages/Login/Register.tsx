import Background from '../../../components/layout/Background.tsx';
import {useRef, useState} from 'react';
import AuthCard from './AuthCard.tsx';
import AuthHeader from './AuthHeader.tsx';
import type {RegisterFormData, RegisterFormRef} from '../../Form/LoginForm/RegisterForm.tsx';
import RegisterForm from '../../Form/LoginForm/RegisterForm.tsx';
import {Button} from '@/components/ui/button.tsx';
import Link from '@/components/ui/Link.tsx';
import {CircleUserRoundIcon, Lock, UserPlus} from 'lucide-react';
import useCreateAdminHook from '../../../lib/User/CreateAdmin/useCreateAdminHook';
import {eventBus} from '../../../lib/EventBus/EventBus';
import {AdminCreationFailedEvent} from '../../../lib/User/CreateAdmin/Event/AdminCreationFailedEvent';

const FORM_FIELD_NAMES = new Set(['email', 'password', 'firstName', 'lastName']);

const Register = () => {
  const [state, setState] = useState<"idle" | "scanning" | "error" | "success">("idle");
  const registerFormRef = useRef<RegisterFormRef>(null);
  const {createAdmin} = useCreateAdminHook();

  const handleOnSubmit = async (data: RegisterFormData) => {
    setState("scanning");

    try {
      const result = await createAdmin({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      if (result.success) {
        setState("success");
        return;
      }

      setState("error");

      const fieldErrors: {field: string; message: string}[] = [];

      result.errors.forEach((error) => {
        const field = error.resource.code.split('.').slice(1).join('.');

        if (FORM_FIELD_NAMES.has(field)) {
          fieldErrors.push({field, message: error.resource.message});
          return;
        }

        eventBus.dispatch(new AdminCreationFailedEvent(error.resource.message));
      });

      registerFormRef.current?.setFieldErrors(fieldErrors);
    } catch (error) {
      console.error('Failed to create admin', error);
      setState("error");
      eventBus.dispatch(new AdminCreationFailedEvent('Nie udało się utworzyć administratora'));
    }
  };

  return (
    <Background>
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <AuthCard state={state}>
          <AuthHeader subtitle="REGISTRATION PROTOCOL" />
          <div className="space-y-6">
            <RegisterForm
              ref={registerFormRef}
              onSubmit={handleOnSubmit}
              lockForm={state === 'scanning'}
            />

            <Button
              type="submit"
              loading={state === 'scanning'}
              leftIcon={<UserPlus className="h-4 w-4" />}
              className="mt-2"
              onClick={() => registerFormRef.current?.submit()}
            >
              Create account
            </Button>

          </div>

          <div className="mt-6 flex justify-center gap-6 text-xs text-zinc-400">
            <Link to="/">
              <span className="flex items-center gap-1"><CircleUserRoundIcon className="h-3 w-3" />Login</span>
            </Link>
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> quantum lock</span>
          </div>

        </AuthCard>
      </div>
    </Background>
  );
}

export default Register;