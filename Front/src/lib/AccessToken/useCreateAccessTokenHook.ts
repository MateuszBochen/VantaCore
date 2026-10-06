import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {toastService} from '../Toast/ToastService';
import type {CreateAccessTokenPayload, CreateAccessTokenResponse, CreateAccessTokenResult} from './Type/types';

// POST /api/user/me/access-tokens - the 422 notifications (unknown resource,
// scope not granted, expiry in the past, limit reached, requires a password/
// SSO login rather than a token) already carry a readable message, so they
// go straight to a toast like every other *-failed case here.
const useCreateAccessTokenHook = () => {
  const {request} = useRequestHook();

  const createAccessToken = async (payload: CreateAccessTokenPayload): Promise<CreateAccessTokenResult> => {
    try {
      const response = await request<CreateAccessTokenPayload, CreateAccessTokenResponse>({
        type: RequestMethod.POST,
        endpoint: '/api/user/me/access-tokens',
        data: payload,
      });

      return {success: true, token: response.data.resource};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', getApiErrorMessage(error, "Couldn't create the token — please try again."));
        return {success: false};
      }
      throw error;
    }
  };

  return {createAccessToken};
};

export default useCreateAccessTokenHook;
