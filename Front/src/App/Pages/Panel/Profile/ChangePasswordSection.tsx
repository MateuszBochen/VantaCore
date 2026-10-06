import {useCallback} from 'react';
import ChangePasswordForm from '@/App/Form/ChangePasswordForm/ChangePasswordForm';
import type {ChangePasswordFieldError, ChangePasswordFormData} from '@/App/Form/ChangePasswordForm/types';
import useChangePasswordHook from '@/lib/User/useChangePasswordHook';
import {eventBus} from '@/lib/EventBus/EventBus';
import {UserPasswordChangeFailedEvent} from '@/lib/User/Event/UserPasswordChangeFailedEvent';

const FORM_FIELDS = new Set<string>(['currentPassword', 'newPassword']);

// Profile's "Change password" tab. A 422's resource.code is
// `<prefix>.<field>` (same convention as UserFormPage/Login) - field codes
// land on their input, anything else (e.g. an SSO-only account with no local
// password) is toasted.
const ChangePasswordSection = () => {
  const {changePassword} = useChangePasswordHook();

  const handleSubmit = useCallback(
    async (data: ChangePasswordFormData): Promise<ChangePasswordFieldError[] | null> => {
      const result = await changePassword({currentPassword: data.currentPassword, newPassword: data.newPassword});

      if (result.success) {
        return null;
      }

      const fieldErrors: ChangePasswordFieldError[] = [];

      result.errors.forEach((error) => {
        const field = error.resource.code.split('.').slice(1).join('.');

        if (FORM_FIELDS.has(field)) {
          fieldErrors.push({field: field as ChangePasswordFieldError['field'], message: error.resource.message});
          return;
        }

        eventBus.dispatch(new UserPasswordChangeFailedEvent(error.resource.message));
      });

      return fieldErrors;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- changePassword is a thin useRequestHook wrapper recreated every render
    [],
  );

  return (
    <div className="max-w-md">
      <ChangePasswordForm onSubmit={handleSubmit} />
    </div>
  );
};

export default ChangePasswordSection;
