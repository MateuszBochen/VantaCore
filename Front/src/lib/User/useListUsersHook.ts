import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListUsersResponse, ListUsersResult} from './Type/types';

// Shaped the same way as useListProjectsHook.
const useListUsersHook = () => {
  const {request} = useRequestHook();

  const listUsers = async (): Promise<ListUsersResult> => {
    try {
      const response = await request<undefined, ListUsersResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/user',
      });

      return {
        success: true,
        users: response.data.data.map((item) => item.resource),
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listUsers};
};

export default useListUsersHook;