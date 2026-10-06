import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListAccessTokensResponse, ListAccessTokensResult} from './Type/types';

// GET /api/user/me/access-tokens - the caller's own tokens, identity from the JWT.
const useListAccessTokensHook = () => {
  const {request} = useRequestHook();

  const listAccessTokens = async (): Promise<ListAccessTokensResult> => {
    try {
      const response = await request<undefined, ListAccessTokensResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/user/me/access-tokens',
      });

      return {success: true, tokens: response.data.data.map((item) => item.resource)};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }
      throw error;
    }
  };

  return {listAccessTokens};
};

export default useListAccessTokensHook;
