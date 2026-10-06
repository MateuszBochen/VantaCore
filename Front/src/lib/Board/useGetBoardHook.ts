import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {boardCache} from './BoardCache';
import type {GetBoardResponse, GetBoardResult} from './Type/types';

// GET /api/board/{boardId} - confirmed 2026-08-05.
const useGetBoardHook = () => {
  const {request} = useRequestHook();

  const getBoard = async (boardId: string): Promise<GetBoardResult> => {
    const cached = boardCache.get(boardId);

    if (cached) {
      return {success: true, board: cached};
    }

    try {
      const response = await request<undefined, GetBoardResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/board/${boardId}`,
      });

      const board = response.data.resource;
      boardCache.set(board);

      return {success: true, board};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {getBoard};
};

export default useGetBoardHook;
