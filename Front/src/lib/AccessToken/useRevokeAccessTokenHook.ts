import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {toastService} from '../Toast/ToastService';
import type {AccessTokenMutationResult} from './Type/types';

// DELETE /api/user/me/access-tokens/{id} - revoking is immediate and final.
const useRevokeAccessTokenHook = () => {
  const {request} = useRequestHook();

  const revokeAccessToken = async (tokenId: string): Promise<AccessTokenMutationResult> => {
    try {
      await request<undefined, void>({
        type: RequestMethod.DELETE,
        endpoint: `/api/user/me/access-tokens/${tokenId}`,
      });

      toastService.push('success', 'Token revoked.');

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', getApiErrorMessage(error, "Couldn't revoke this token — please try again."));
        return {success: false};
      }
      throw error;
    }
  };

  return {revokeAccessToken};
};

export default useRevokeAccessTokenHook;
