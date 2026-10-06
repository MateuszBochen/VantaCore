import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {UserPasswordWasChangedEvent} from './Event/UserPasswordWasChangedEvent';
import {UserPasswordChangeFailedEvent} from './Event/UserPasswordChangeFailedEvent';
import type {ChangePasswordPayload, ChangePasswordResult, CreateUserErrorResponse} from './Type/types';

// PUT /api/user/me/password - a 422 comes back as field errors for the
// caller to map onto the form (same as useCreateUserHook); any other
// failure is toasted here and returns no errors.
const useChangePasswordHook = () => {
  const {request} = useRequestHook();

  const changePassword = async (payload: ChangePasswordPayload): Promise<ChangePasswordResult> => {
    try {
      await request<ChangePasswordPayload, void>({
        type: RequestMethod.PUT,
        endpoint: '/api/user/me/password',
        data: payload,
      });

      eventBus.dispatch(new UserPasswordWasChangedEvent('Password changed.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const body = error.response.data as Partial<CreateUserErrorResponse> | undefined;

        return {success: false, errors: body?.data ?? []};
      }

      if (isAxiosError(error)) {
        eventBus.dispatch(new UserPasswordChangeFailedEvent("Couldn't change the password — please try again."));
        return {success: false, errors: []};
      }

      throw error;
    }
  };

  return {changePassword};
};

export default useChangePasswordHook;
