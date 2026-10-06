import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {RoleWasDeletedEvent} from './Event/RoleWasDeletedEvent';
import {RoleDeleteFailedEvent} from './Event/RoleDeleteFailedEvent';
import type {DeleteRoleResult} from './Type/types';

const useDeleteRoleHook = () => {
  const {request} = useRequestHook();

  const deleteRole = async (roleId: string): Promise<DeleteRoleResult> => {
    try {
      await request<undefined, void>({
        type: RequestMethod.DELETE,
        endpoint: `/api/role/${roleId}`,
      });

      eventBus.dispatch(new RoleWasDeletedEvent('Role deleted.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new RoleDeleteFailedEvent(getApiErrorMessage(error, "Couldn't delete the role — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {deleteRole};
};

export default useDeleteRoleHook;
