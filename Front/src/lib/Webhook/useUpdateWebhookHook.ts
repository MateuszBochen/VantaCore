import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {toastService} from '../Toast/ToastService';
import type {WebhookEventType, WebhookMutationResult} from './Type/types';

type UpdateWebhookPayload = {
  eventTypes: WebhookEventType[];
  targetUrl: string;
  enabled: boolean;
};

// Never touches the secret - rotating it is its own endpoint (see
// useRotateWebhookSecretHook), the same split VCS Integration's connection
// editing uses.
const useUpdateWebhookHook = () => {
  const {request} = useRequestHook();

  const updateWebhook = async (projectId: string, webhookId: string, payload: UpdateWebhookPayload): Promise<WebhookMutationResult> => {
    try {
      await request<UpdateWebhookPayload, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/project/${projectId}/webhook/${webhookId}`,
        data: payload,
      });

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', getApiErrorMessage(error, "Couldn't save this webhook — please try again."));
        return {success: false};
      }
      throw error;
    }
  };

  return {updateWebhook};
};

export default useUpdateWebhookHook;
