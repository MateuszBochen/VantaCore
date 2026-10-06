import axios, {type AxiosPromise, type AxiosRequestHeaders} from 'axios';
import qs from 'qs';
import {SettingName} from '../Settings/Enum/SettingName';
import {Settings} from '../Settings/Settings';
import type {TypeRequestType} from './Type/types';
import JwtManager from '../Jwt/JwtManager';
import {eventBus} from '../EventBus/EventBus';
import {RequestStartedEvent} from './Event/RequestStartedEvent';
import {RequestFinishedEvent} from './Event/RequestFinishedEvent';

// The actual request logic, factored out of useRequestHook so non-React code
// can issue the exact same authenticated request - useRequestHook has no
// real hook dependencies of its own (no useState/useEffect/useContext), it's
// just this function wrapped in the app's hook-calling convention for
// components/hooks. Needed by tiptap/AttachmentImage's node view, which
// (being a vanilla ProseMirror NodeView, not a React component) can't call
// hooks to get at it another way.
export const apiRequest = <I, R>(request: TypeRequestType<I>): AxiosPromise<R> => {
  const jwtManager = JwtManager.getInstance();
  const host = Settings.getSetting(SettingName.API_HOST);
  const env = Settings.getSetting(SettingName.ENV);

  if (env === 'dev') {
    if (!request.query) {
      request.query = {
        XDEBUG_SESSION_START: 'PHPSTORM',
      };
    }
  }

  let params = '';

  if (request.query) {
    params = `?${qs.stringify(request.query, {encode: false})}`;
  }

  const url = `${host}${request.endpoint}${params}`;

  const headers = {} as AxiosRequestHeaders;

  if (jwtManager.jwtIsValid()) {
    headers['Authorization'] = `Bearer ${jwtManager.getJwt()}`;
  }

  eventBus.dispatch(new RequestStartedEvent());

  return axios({
    method: request.type,
    url: url,
    data: request.data,
    headers,
    onUploadProgress: request.onUploadProgress,
    responseType: request.responseType,
  }).finally(() => {
    eventBus.dispatch(new RequestFinishedEvent());
  });
};
