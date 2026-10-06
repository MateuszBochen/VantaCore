import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {SprintWasClosedEvent} from './Event/SprintWasClosedEvent';
import {SprintActionFailedEvent} from './Event/SprintActionFailedEvent';
import type {SprintActionResult} from './Type/types';

// POST /api/board/{boardId}/sprint/{sprintId}/close - confirmed 2026-08-05,
// empty body. Transitions a sprint active -> closed.
const useCloseSprintHook = () => {
  const {request} = useRequestHook();

  const closeSprint = async (boardId: string, sprintId: string): Promise<SprintActionResult> => {
    try {
      await request<Record<string, never>, void>({
        type: RequestMethod.POST,
        endpoint: `/api/board/${boardId}/sprint/${sprintId}/close`,
        data: {},
      });

      eventBus.dispatch(new SprintWasClosedEvent('Sprint closed.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        // Same real-reason-over-generic-message precedent as useStartSprintHook.
        eventBus.dispatch(new SprintActionFailedEvent(getApiErrorMessage(error, "Couldn't close the sprint — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {closeSprint};
};

export default useCloseSprintHook;
