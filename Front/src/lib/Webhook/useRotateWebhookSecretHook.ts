import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {toastService} from '../Toast/ToastService';
import type {RotateWebhookSecretResponse, RotateWebhookSecretResult} from './Type/types';

// The only way to see a working secret again once the original create
// response is gone - invalidates the old one, so anything verifying
// X-VantaCore-Signature on the receiving end needs updating with the new
// value afterwards. Same trade-off (and the same fix for the same "I lost
// it" problem) as Git / VCS Integration's own rotate-secret endpoint.
const useRotateWebhookSecretHook = () => {
  const {request} = useRequestHook();

  const rotateWebhookSecret = async (projectId: string, webhookId: string): Promise<RotateWebhookSecretResult> => {
    try {
      const response = await request<undefined, RotateWebhookSecretResponse>({
        type: RequestMethod.POST,
        endpoint: `/api/project/${projectId}/webhook/${webhookId}/secret`,
      });

      return {success: true, secret: response.data.resource.secret};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', "Couldn't regenerate the secret — please try again.");
        return {success: false};
      }
      throw error;
    }
  };

  return {rotateWebhookSecret};
};

export default useRotateWebhookSecretHook;
