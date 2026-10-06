import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {GetTicketTagsResponse, GetTicketTagsResult} from './Type/types';

const useGetTicketTagsHook = () => {
  const {request} = useRequestHook();

  const getTicketTags = async (projectId: string): Promise<GetTicketTagsResult> => {
    try {
      const response = await request<undefined, GetTicketTagsResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/ticket/tags`,
      });

      return {success: true, tags: response.data.resource};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {getTicketTags};
};

export default useGetTicketTagsHook;
