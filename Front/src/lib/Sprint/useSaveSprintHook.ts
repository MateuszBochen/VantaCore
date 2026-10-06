import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {SprintWasSavedEvent} from './Event/SprintWasSavedEvent';
import {SprintSaveFailedEvent} from './Event/SprintSaveFailedEvent';
import type {SaveSprintPayload, SaveSprintResult, Sprint} from './Type/types';

// PUT /api/board/{boardId}/sprint/{sprintId} - confirmed 2026-08-05, a
// single upsert endpoint covers both create and update, since a Sprint's id
// is always client-generated (createDraftSprint) - no separate POST needed.
// The body only accepts name/startDate/endDate/tickets - status and every
// server-managed field (startedAt, report, ...) are stripped before sending.
const useSaveSprintHook = () => {
  const {request} = useRequestHook();

  const saveSprint = async (sprint: Sprint): Promise<SaveSprintResult> => {
    try {
      const payload: SaveSprintPayload = {
        name: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        tickets: sprint.tickets,
      };

      await request<SaveSprintPayload, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/board/${sprint.boardId}/sprint/${sprint.id}`,
        data: payload,
      });

      eventBus.dispatch(new SprintWasSavedEvent('Sprint saved.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new SprintSaveFailedEvent(getApiErrorMessage(error, "Couldn't save the sprint — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {saveSprint};
};

export default useSaveSprintHook;
