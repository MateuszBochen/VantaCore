import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {UserRolesWereAssignedEvent} from './Event/UserRolesWereAssignedEvent';
import {UserRolesAssignFailedEvent} from './Event/UserRolesAssignFailedEvent';
import type {AssignUserRolesResult} from './Type/types';

type AssignUserRolesPayload = {
  roleIds: string[];
};

const useAssignUserRolesHook = () => {
  const {request} = useRequestHook();

  const assignUserRoles = async (userId: string, roleIds: string[]): Promise<AssignUserRolesResult> => {
    try {
      await request<AssignUserRolesPayload, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/user/${userId}/roles`,
        data: {roleIds},
      });

      eventBus.dispatch(new UserRolesWereAssignedEvent('Roles updated.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new UserRolesAssignFailedEvent(getApiErrorMessage(error, "Couldn't update roles — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {assignUserRoles};
};

export default useAssignUserRolesHook;
