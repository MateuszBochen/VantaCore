import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {toastService} from '../Toast/ToastService';
import type {TestWebhookResult} from './Type/types';

// Fires a synthetic test event through the real delivery pipeline - the
// actual attempt (status code, success/fail) shows up as a new row in this
// webhook's own delivery log, not in this call's own response, so callers
// should refetch the log after this resolves rather than reading anything
// off the result here.
const useTestWebhookHook = () => {
  const {request} = useRequestHook();

  const testWebhook = async (projectId: string, webhookId: string): Promise<TestWebhookResult> => {
    try {
      await request<undefined, void>({
        type: RequestMethod.POST,
        endpoint: `/api/project/${projectId}/webhook/${webhookId}/test`,
      });

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', "Couldn't send a test event — please try again.");
        return {success: false};
      }
      throw error;
    }
  };

  return {testWebhook};
};

export default useTestWebhookHook;
