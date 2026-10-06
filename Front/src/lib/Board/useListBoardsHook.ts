import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListBoardsResponse, ListBoardsResult} from './Type/types';

// GET /api/board - confirmed 2026-08-05.
const useListBoardsHook = () => {
  const {request} = useRequestHook();

  const listBoards = async (): Promise<ListBoardsResult> => {
    try {
      const response = await request<undefined, ListBoardsResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/board',
      });

      return {success: true, boards: response.data.data.map((item) => item.resource)};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listBoards};
};

export default useListBoardsHook;
