import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {toastService} from '../Toast/ToastService';
import type {CreateWebhookResponse, CreateWebhookResult, WebhookEventType, WebhookTargetType} from './Type/types';

type CreateWebhookPayload = {
  eventTypes: WebhookEventType[];
  targetType: WebhookTargetType;
  targetUrl: string;
};

const useCreateWebhookHook = () => {
  const {request} = useRequestHook();

  const createWebhook = async (projectId: string, payload: CreateWebhookPayload): Promise<CreateWebhookResult> => {
    try {
      const response = await request<CreateWebhookPayload, CreateWebhookResponse>({
        type: RequestMethod.POST,
        endpoint: `/api/project/${projectId}/webhook`,
        data: payload,
      });

      return {success: true, webhook: response.data.resource};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', getApiErrorMessage(error, "Couldn't create the webhook — please try again."));
        return {success: false};
      }
      throw error;
    }
  };

  return {createWebhook};
};

export default useCreateWebhookHook;
