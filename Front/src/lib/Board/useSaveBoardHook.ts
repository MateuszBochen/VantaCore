import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {boardCache} from './BoardCache';
import {BoardWasCreatedEvent} from './Event/BoardWasCreatedEvent';
import {BoardWasSavedEvent} from './Event/BoardWasSavedEvent';
import {BoardSaveFailedEvent} from './Event/BoardSaveFailedEvent';
import type {Board, SaveBoardResult} from './Type/types';

type SaveBoardOptions = {
  isNew?: boolean;
};

const useSaveBoardHook = () => {
  const {request} = useRequestHook();

  // POST /api/board (create) / PUT /api/board/{boardId} (update) - both
  // confirmed 2026-08-05, same full-board payload shape as GET's resource
  // either way (assumed for PUT specifically, matching every other
  // resource's PUT convention in this app - correct if it turns out
  // otherwise).
  const saveBoard = async (board: Board, options: SaveBoardOptions = {}): Promise<SaveBoardResult> => {
    try {
      await request<Board, void>({
        type: options.isNew ? RequestMethod.POST : RequestMethod.PUT,
        endpoint: options.isNew ? '/api/board' : `/api/board/${board.id}`,
        data: board,
      });

      boardCache.set(board);

      if (options.isNew) {
        eventBus.dispatch(new BoardWasCreatedEvent(board));
      } else {
        eventBus.dispatch(new BoardWasSavedEvent('Board saved.'));
      }

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(
          new BoardSaveFailedEvent(
            getApiErrorMessage(error, options.isNew ? "Couldn't create the board — please try again." : "Couldn't save changes — please try again."),
          ),
        );
        return {success: false};
      }

      throw error;
    }
  };

  return {saveBoard};
};

export default useSaveBoardHook;
