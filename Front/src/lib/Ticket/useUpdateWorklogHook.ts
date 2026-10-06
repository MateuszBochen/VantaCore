import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {TicketSaveFailedEvent} from './Event/TicketSaveFailedEvent';
import {TicketWasSavedEvent} from './Event/TicketWasSavedEvent';
import type {WorklogMutationResult} from './Type/types';
import type {LogWorklogPayload} from './useLogWorklogHook';

// PUT /api/project/{projectId}/ticket/{ticketId}/worklog/{worklogId} - edits
// an existing entry. The backend adjusts timeSpent/timeSpentAll by the
// *difference* between the old and new minutes (not by re-adding the new
// value) - callers must apply that same difference to their local ticket
// optimistically (see TicketWorklogSection).
const useUpdateWorklogHook = () => {
  const {request} = useRequestHook();

  const updateWorklog = async (
    projectId: string,
    ticketId: string,
    worklogId: string,
    payload: LogWorklogPayload,
  ): Promise<WorklogMutationResult> => {
    try {
      await request<LogWorklogPayload, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/worklog/${worklogId}`,
        data: payload,
      });

      eventBus.dispatch(new TicketWasSavedEvent('Time entry updated.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new TicketSaveFailedEvent(getApiErrorMessage(error, "Couldn't update the time entry — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {updateWorklog};
};

export default useUpdateWorklogHook;
