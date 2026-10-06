import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListProjectsResponse, ListProjectsResult} from './Type/types';

const useListProjectsHook = () => {
  const {request} = useRequestHook();

  const listProjects = async (): Promise<ListProjectsResult> => {
    try {
      const response = await request<undefined, ListProjectsResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/project',
      });

      return {
        success: true,
        projects: response.data.data.map((item) => item.resource),
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listProjects};
};

export default useListProjectsHook;
