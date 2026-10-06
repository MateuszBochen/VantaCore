import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListRoleResourcesResponse, ListRoleResourcesResult} from './Type/types';

// The fixed catalog of assignable permission codes - fed into
// RoleResourcesSection's checkbox list.
const useListRoleResourcesHook = () => {
  const {request} = useRequestHook();

  const listRoleResources = async (): Promise<ListRoleResourcesResult> => {
    try {
      const response = await request<undefined, ListRoleResourcesResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/role/resource',
      });

      return {
        success: true,
        resources: response.data.data.map((item) => item.resource),
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listRoleResources};
};

export default useListRoleResourcesHook;
