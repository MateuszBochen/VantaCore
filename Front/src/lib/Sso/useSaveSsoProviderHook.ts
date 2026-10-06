import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import type {SaveSsoProviderPayload, SaveSsoProviderResult, SsoProvider} from './Type/types';

// PUT /api/settings/sso/{provider} - one provider at a time, each has its
// own Save on the SSO tab.
const useSaveSsoProviderHook = () => {
  const {request} = useRequestHook();

  const saveSsoProvider = async (provider: SsoProvider, payload: SaveSsoProviderPayload): Promise<SaveSsoProviderResult> => {
    try {
      await request<SaveSsoProviderPayload, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/settings/sso/${provider.toLowerCase()}`,
        data: payload,
      });

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        const message =
          error.response?.status === 404
            ? 'SSO is not available on the server yet.'
            : getApiErrorMessage(error, "Couldn't save these settings — please try again.");
        return {success: false, message};
      }

      throw error;
    }
  };

  return {saveSsoProvider};
};

export default useSaveSsoProviderHook;
