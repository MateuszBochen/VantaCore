import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {GlobalSearchResponse, GlobalSearchResult, SearchScope} from './Type/types';
import {unwrapSearchResource} from './unwrapSearchSection';

const useGlobalSearchHook = () => {
  const {request} = useRequestHook();

  const search = async (query: string, scope: SearchScope, projectId?: string): Promise<GlobalSearchResult> => {
    try {
      const response = await request<undefined, GlobalSearchResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/search',
        query: scope === 'project' && projectId ? {q: query, scope, projectId} : {q: query, scope},
      });

      return {success: true, ...unwrapSearchResource(response.data.resource)};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {search};
};

export default useGlobalSearchHook;
