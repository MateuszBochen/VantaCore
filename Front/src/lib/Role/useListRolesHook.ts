import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListRolesResponse, ListRolesResult} from './Type/types';

// Shaped the same way as useListUsersHook/useListBoardsHook.
const useListRolesHook = () => {
  const {request} = useRequestHook();

  const listRoles = async (): Promise<ListRolesResult> => {
    try {
      const response = await request<undefined, ListRolesResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/role',
      });

      return {
        success: true,
        roles: response.data.data.map((item) => item.resource),
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listRoles};
};

export default useListRolesHook;
