import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListVcsConnectionsResponse, ListVcsConnectionsResult} from './Type/types';

const useListVcsConnectionsHook = () => {
  const {request} = useRequestHook();

  const listVcsConnections = async (projectId: string): Promise<ListVcsConnectionsResult> => {
    try {
      const response = await request<undefined, ListVcsConnectionsResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/vcs-connection`,
      });

      return {success: true, connections: response.data.data.map((item) => item.resource)};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }
      throw error;
    }
  };

  return {listVcsConnections};
};

export default useListVcsConnectionsHook;
