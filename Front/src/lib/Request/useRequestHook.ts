import type {TypeUseRequestHook} from './Type/types';
import {apiRequest} from './apiRequest';

const useRequestHook = (): TypeUseRequestHook => {
  return {
    request: apiRequest,
  };
};

export default useRequestHook;
