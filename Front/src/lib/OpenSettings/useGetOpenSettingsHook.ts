import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {GetOpenSettingsResponse, GetOpenSettingsResult} from './Type/types';

// GET /web-api/open-settings - public (no sign-in needed), same /web-api
// prefix as login itself.
const useGetOpenSettingsHook = () => {
  const {request} = useRequestHook();

  const getOpenSettings = async (): Promise<GetOpenSettingsResult> => {
    try {
      const response = await request<undefined, GetOpenSettingsResponse>({
        type: RequestMethod.GET,
        endpoint: '/web-api/open-settings',
      });

      return {success: true, settings: response.data.resource};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {getOpenSettings};
};

export default useGetOpenSettingsHook;
