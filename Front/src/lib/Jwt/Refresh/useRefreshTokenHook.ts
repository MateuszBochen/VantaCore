import useRequestHook from '../../Request/useRequestHook';
import {RequestMethod} from '../../Request/Type/types';
import type {RefreshTokenResponse} from './Type/types';

const useRefreshTokenHook = () => {
  const {request} = useRequestHook();

  const refreshToken = async (): Promise<string> => {
    const response = await request<undefined, RefreshTokenResponse>({
      type: RequestMethod.POST,
      endpoint: '/api/auth/refresh',
    });

    return response.data.resource.token;
  };

  return {refreshToken};
};

export default useRefreshTokenHook;