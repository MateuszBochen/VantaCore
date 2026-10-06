import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListSprintsQuery, ListSprintsResponse, ListSprintsResult} from './Type/types';

// GET /api/board/{boardId}/sprint - confirmed 2026-08-05, same
// {meta, data:[{id,resource}]} envelope as every other list endpoint.
// `from`/`till` are an optional date-range filter (unused by any caller yet).
const useListSprintsHook = () => {
  const {request} = useRequestHook();

  const listSprints = async (boardId: string, query: ListSprintsQuery = {}): Promise<ListSprintsResult> => {
    try {
      const response = await request<undefined, ListSprintsResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/board/${boardId}/sprint`,
        query: {
          ...(query.from ? {from: query.from} : {}),
          ...(query.till ? {till: query.till} : {}),
        },
      });

      return {success: true, sprints: response.data.data.map((item) => item.resource)};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listSprints};
};

export default useListSprintsHook;
