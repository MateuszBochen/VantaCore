import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {toastService} from '../Toast/ToastService';
import type {NotificationPreference, SaveNotificationPreferenceResult} from './Type/types';

// Upsert by (projectId, eventType) - PUT is both create and update, same
// convention as every other resource in this app, just keyed by this
// composite pair instead of a client-generated uuid (there's nothing to
// generate an id for; the pair itself is the identity, scoped to the
// authenticated user server-side).
const useSaveNotificationPreferenceHook = () => {
  const {request} = useRequestHook();

  const saveNotificationPreference = async (preference: NotificationPreference): Promise<SaveNotificationPreferenceResult> => {
    try {
      await request<NotificationPreference, void>({
        type: RequestMethod.PUT,
        endpoint: '/api/user/notification-preference',
        data: preference,
      });

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', getApiErrorMessage(error, "Couldn't save this preference — please try again."));
        return {success: false};
      }
      throw error;
    }
  };

  return {saveNotificationPreference};
};

export default useSaveNotificationPreferenceHook;
