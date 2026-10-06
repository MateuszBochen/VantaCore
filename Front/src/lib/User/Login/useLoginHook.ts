import {isAxiosError} from 'axios';
import useRequestHook from '../../Request/useRequestHook';
import {RequestMethod} from '../../Request/Type/types';
import JwtManager from '../../Jwt/JwtManager';
import type {LoginErrorResponse, LoginRequestData, LoginResponse, LoginResult} from './Type/types';

const CLIENT_ERROR_STATUSES = [401, 422];

const useLoginHook = () => {
  const {request} = useRequestHook();

  const login = async (data: LoginRequestData): Promise<LoginResult> => {
    try {
      const response = await request<LoginRequestData, LoginResponse>({
        type: RequestMethod.POST,
        endpoint: '/web-api/auth/login',
        data,
      });

      const jwtManager = JwtManager.getInstance();
      jwtManager.setJwt(response.data.resource.token);
      jwtManager.setEmail(response.data.resource.email);

      return {success: true};
    } catch (error) {
      if (isAxiosError(error) && error.response && CLIENT_ERROR_STATUSES.includes(error.response.status)) {
        const body = error.response.data as LoginErrorResponse;

        return {success: false, errors: body.data};
      }

      throw error;
    }
  };

  return {login};
};

export default useLoginHook;