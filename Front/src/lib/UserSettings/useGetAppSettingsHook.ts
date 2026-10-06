import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {GetAppSettingsResponse, GetAppSettingsResult} from './Type/types';

const useGetAppSettingsHook = () => {
  const {request} = useRequestHook();

  const getAppSettings = async (): Promise<GetAppSettingsResult> => {
    try {
      const response = await request<undefined, GetAppSettingsResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/app-settings',
      });

      return {success: true, userSettings: response.data.resource.userSettings};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {getAppSettings};
};

export default useGetAppSettingsHook;
