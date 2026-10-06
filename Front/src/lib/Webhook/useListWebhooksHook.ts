import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListWebhooksResponse, ListWebhooksResult} from './Type/types';

const useListWebhooksHook = () => {
  const {request} = useRequestHook();

  const listWebhooks = async (projectId: string): Promise<ListWebhooksResult> => {
    try {
      const response = await request<undefined, ListWebhooksResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/webhook`,
      });

      return {success: true, webhooks: response.data.data.map((item) => item.resource)};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }
      throw error;
    }
  };

  return {listWebhooks};
};

export default useListWebhooksHook;
