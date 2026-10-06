import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {RoleWasSavedEvent} from './Event/RoleWasSavedEvent';
import {RoleSaveFailedEvent} from './Event/RoleSaveFailedEvent';
import type {SaveRolePayload, SaveRoleResult} from './Type/types';

type SaveRoleOptions = {
  isNew?: boolean;
  // Only meaningful when !isNew - which existing role to PUT.
  roleId?: string;
};

// POST /api/role (create) / PUT /api/role/{roleId} (update) - unlike Board/
// Sprint, the payload is just {name, resources} (no id/isSystem echoed
// back), since there's no GET-single-role endpoint to round-trip through.
const useSaveRoleHook = () => {
  const {request} = useRequestHook();

  const saveRole = async (payload: SaveRolePayload, options: SaveRoleOptions = {}): Promise<SaveRoleResult> => {
    try {
      await request<SaveRolePayload, void>({
        type: options.isNew ? RequestMethod.POST : RequestMethod.PUT,
        endpoint: options.isNew ? '/api/role' : `/api/role/${options.roleId}`,
        data: payload,
      });

      eventBus.dispatch(new RoleWasSavedEvent(options.isNew ? 'Role created.' : 'Role saved.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(
          new RoleSaveFailedEvent(
            getApiErrorMessage(error, options.isNew ? "Couldn't create the role — please try again." : "Couldn't save changes — please try again."),
          ),
        );
        return {success: false};
      }

      throw error;
    }
  };

  return {saveRole};
};

export default useSaveRoleHook;
