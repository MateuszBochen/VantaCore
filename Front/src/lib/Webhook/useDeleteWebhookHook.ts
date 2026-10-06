import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {toastService} from '../Toast/ToastService';
import type {WebhookMutationResult} from './Type/types';

const useDeleteWebhookHook = () => {
  const {request} = useRequestHook();

  const deleteWebhook = async (projectId: string, webhookId: string): Promise<WebhookMutationResult> => {
    try {
      await request<undefined, void>({
        type: RequestMethod.DELETE,
        endpoint: `/api/project/${projectId}/webhook/${webhookId}`,
      });

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', "Couldn't delete this webhook — please try again.");
        return {success: false};
      }
      throw error;
    }
  };

  return {deleteWebhook};
};

export default useDeleteWebhookHook;
