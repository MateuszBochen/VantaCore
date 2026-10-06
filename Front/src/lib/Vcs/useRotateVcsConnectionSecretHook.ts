import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {toastService} from '../Toast/ToastService';
import type {RotateVcsConnectionSecretResponse, RotateVcsConnectionSecretResult} from './Type/types';

// The only way to see a working secret again once the original create
// response is gone - invalidates the old one, so the provider's webhook
// config needs updating with the new value afterwards (same trade-off as
// regenerating any other API key/token elsewhere).
const useRotateVcsConnectionSecretHook = () => {
  const {request} = useRequestHook();

  const rotateVcsConnectionSecret = async (projectId: string, connectionId: string): Promise<RotateVcsConnectionSecretResult> => {
    try {
      const response = await request<undefined, RotateVcsConnectionSecretResponse>({
        type: RequestMethod.POST,
        endpoint: `/api/project/${projectId}/vcs-connection/${connectionId}/secret`,
      });

      return {success: true, webhookSecret: response.data.resource.webhookSecret};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', "Couldn't regenerate the secret — please try again.");
        return {success: false};
      }
      throw error;
    }
  };

  return {rotateVcsConnectionSecret};
};

export default useRotateVcsConnectionSecretHook;
