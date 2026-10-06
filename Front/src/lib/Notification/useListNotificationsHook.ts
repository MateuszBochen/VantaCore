import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListNotificationsResponse, ListNotificationsResult} from './Type/types';

const useListNotificationsHook = () => {
  const {request} = useRequestHook();

  const listNotifications = async (): Promise<ListNotificationsResult> => {
    try {
      const response = await request<undefined, ListNotificationsResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/notification',
      });

      return {
        success: true,
        notifications: response.data.data.map((item) => item.resource),
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listNotifications};
};

export default useListNotificationsHook;
