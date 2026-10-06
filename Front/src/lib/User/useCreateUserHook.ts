import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {UserWasCreatedEvent} from './Event/UserWasCreatedEvent';
import type {CreateUserErrorResponse, CreateUserPayload, CreateUserResult} from './Type/types';

// Same 422 field-error shape/handling as useCreateAdminHook - the caller
// maps `errors[].resource.code` to form fields itself, this hook only
// distinguishes "validation failed" (422, return errors) from anything else
// (rethrow).
const useCreateUserHook = () => {
  const {request} = useRequestHook();

  const createUser = async (payload: CreateUserPayload): Promise<CreateUserResult> => {
    try {
      await request<CreateUserPayload, void>({
        type: RequestMethod.POST,
        endpoint: '/api/user',
        data: payload,
      });

      eventBus.dispatch(new UserWasCreatedEvent('User created.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const body = error.response.data as CreateUserErrorResponse;

        return {success: false, errors: body.data};
      }

      throw error;
    }
  };

  return {createUser};
};

export default useCreateUserHook;
