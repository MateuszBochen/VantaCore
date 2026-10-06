import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {MarkNotificationReadResult} from './Type/types';

const useMarkNotificationReadHook = () => {
  const {request} = useRequestHook();

  const markNotificationRead = async (id: string): Promise<MarkNotificationReadResult> => {
    try {
      await request<undefined, void>({
        type: RequestMethod.POST,
        endpoint: `/api/notification/${id}/read`,
      });

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {markNotificationRead};
};

export default useMarkNotificationReadHook;
