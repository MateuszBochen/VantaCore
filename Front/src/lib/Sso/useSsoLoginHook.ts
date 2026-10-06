import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import JwtManager from '../Jwt/JwtManager';
import buildSsoRedirectUri from './buildSsoRedirectUri';
import type {LoginErrorResponse, LoginResponse} from '../User/Login/Type/types';
import type {SsoProvider} from './Type/types';

type SsoAuthorizationResponse = {
  id: string;
  type: string;
  resource: {authorizationUrl: string};
};

type SsoCallbackRequest = {
  code: string;
  state: string;
  redirectUri: string;
};

export type StartSsoLoginResult = {success: true; authorizationUrl: string} | {success: false; message: string};
export type CompleteSsoLoginResult = {success: true} | {success: false; message: string};

const FALLBACK_MESSAGE = "Couldn't sign in with this provider - please try again.";

// 401/422 carry the Api's own message (e.g. "no VantaCore account for this
// email"), same body shape as a failed password login.
const messageOf = (error: unknown): string => {
  if (isAxiosError(error) && error.response && [401, 422].includes(error.response.status)) {
    const body = error.response.data as Partial<LoginErrorResponse> | undefined;
    return body?.data?.[0]?.resource?.message || FALLBACK_MESSAGE;
  }

  return FALLBACK_MESSAGE;
};

// SSO sign-in, both halves (see the Api's SsoAuthController, /web-api -
// nobody has a token yet):
// 1. start - ask the Api for the provider's sign-in URL, then the caller
//    sends the browser there;
// 2. complete - the provider sends the browser back to /login/sso/
//    {provider} (a FRONT route, so the Api address never shows); that page
//    posts code + state here and gets the same result as a password login.
// redirectUri is sent on both, built the same way - the Api only accepts
// exactly {app.front-url}/login/sso/{provider}, and the provider requires
// the same value on both legs.
const useSsoLoginHook = () => {
  const {request} = useRequestHook();

  const startSsoLogin = async (provider: SsoProvider): Promise<StartSsoLoginResult> => {
    try {
      const response = await request<undefined, SsoAuthorizationResponse>({
        type: RequestMethod.GET,
        endpoint: `/web-api/auth/sso/${provider.toLowerCase()}/authorize`,
        query: {redirectUri: buildSsoRedirectUri(provider)},
      });

      return {success: true, authorizationUrl: response.data.resource.authorizationUrl};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false, message: messageOf(error)};
      }

      throw error;
    }
  };

  const completeSsoLogin = async (provider: SsoProvider, code: string, state: string): Promise<CompleteSsoLoginResult> => {
    try {
      const response = await request<SsoCallbackRequest, LoginResponse>({
        type: RequestMethod.POST,
        endpoint: `/web-api/auth/sso/${provider.toLowerCase()}/callback`,
        data: {code, state, redirectUri: buildSsoRedirectUri(provider)},
      });

      // Exactly what a password login stores (useLoginHook).
      const jwtManager = JwtManager.getInstance();
      jwtManager.setJwt(response.data.resource.token);
      jwtManager.setEmail(response.data.resource.email);

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false, message: messageOf(error)};
      }

      throw error;
    }
  };

  return {startSsoLogin, completeSsoLogin};
};

export default useSsoLoginHook;
