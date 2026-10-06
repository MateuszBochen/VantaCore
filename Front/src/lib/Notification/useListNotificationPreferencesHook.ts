import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListNotificationPreferencesResponse, ListNotificationPreferencesResult} from './Type/types';

const useListNotificationPreferencesHook = () => {
  const {request} = useRequestHook();

  const listNotificationPreferences = async (): Promise<ListNotificationPreferencesResult> => {
    try {
      const response = await request<undefined, ListNotificationPreferencesResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/user/notification-preference',
      });

      return {success: true, preferences: response.data.data.map((item) => item.resource)};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listNotificationPreferences};
};

export default useListNotificationPreferencesHook;
