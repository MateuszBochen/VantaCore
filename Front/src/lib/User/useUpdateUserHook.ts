import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {UserWasUpdatedEvent} from './Event/UserWasUpdatedEvent';
import {UserUpdateFailedEvent} from './Event/UserUpdateFailedEvent';
import type {UpdateUserPayload, UpdateUserResult} from './Type/types';

// PUT /api/user/{userId} - basics only (email/firstName/lastName). Roles go
// through useAssignUserRolesHook separately.
const useUpdateUserHook = () => {
  const {request} = useRequestHook();

  const updateUser = async (userId: string, payload: UpdateUserPayload): Promise<UpdateUserResult> => {
    try {
      await request<UpdateUserPayload, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/user/${userId}`,
        data: payload,
      });

      eventBus.dispatch(new UserWasUpdatedEvent('User saved.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new UserUpdateFailedEvent(getApiErrorMessage(error, "Couldn't save changes — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {updateUser};
};

export default useUpdateUserHook;
