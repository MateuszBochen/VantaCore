import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListWebhookDeliveriesResponse, ListWebhookDeliveriesResult} from './Type/types';

const useListWebhookDeliveriesHook = () => {
  const {request} = useRequestHook();

  const listWebhookDeliveries = async (projectId: string, webhookId: string): Promise<ListWebhookDeliveriesResult> => {
    try {
      const response = await request<undefined, ListWebhookDeliveriesResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/webhook/${webhookId}/deliveries`,
      });

      return {success: true, deliveries: response.data.data.map((item) => item.resource)};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }
      throw error;
    }
  };

  return {listWebhookDeliveries};
};

export default useListWebhookDeliveriesHook;
