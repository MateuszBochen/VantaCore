import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListSsoSettingsResponse, ListSsoSettingsResult} from './Type/types';

// GET /api/settings/sso - every provider's configuration (one entry per
// provider, including unconfigured ones, see the SSO spec).
const useListSsoSettingsHook = () => {
  const {request} = useRequestHook();

  const listSsoSettings = async (): Promise<ListSsoSettingsResult> => {
    try {
      const response = await request<undefined, ListSsoSettingsResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/settings/sso',
      });

      return {success: true, providers: response.data.data.map((item) => item.resource)};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listSsoSettings};
};

export default useListSsoSettingsHook;
