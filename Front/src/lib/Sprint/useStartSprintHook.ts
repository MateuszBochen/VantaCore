import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {SprintWasStartedEvent} from './Event/SprintWasStartedEvent';
import {SprintActionFailedEvent} from './Event/SprintActionFailedEvent';
import type {SprintActionResult} from './Type/types';

// POST /api/board/{boardId}/sprint/{sprintId}/start - confirmed 2026-08-05,
// empty body. Transitions a sprint future -> active; deliberately a separate
// action from creation/save (see memory: project_vantacore_boards_concept).
const useStartSprintHook = () => {
  const {request} = useRequestHook();

  const startSprint = async (boardId: string, sprintId: string): Promise<SprintActionResult> => {
    try {
      await request<Record<string, never>, void>({
        type: RequestMethod.POST,
        endpoint: `/api/board/${boardId}/sprint/${sprintId}/start`,
        data: {},
      });

      eventBus.dispatch(new SprintWasStartedEvent('Sprint started.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        // 422 carries a real reason (e.g. "missing-estimate-unit" - a
        // project with tickets in this sprint has no estimate unit
        // configured) - show that instead of a generic message whenever
        // it's there; only fall back for other failures (network error, 500).
        eventBus.dispatch(new SprintActionFailedEvent(getApiErrorMessage(error, "Couldn't start the sprint — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {startSprint};
};

export default useStartSprintHook;
