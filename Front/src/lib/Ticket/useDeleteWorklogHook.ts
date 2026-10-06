import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {TicketSaveFailedEvent} from './Event/TicketSaveFailedEvent';
import {TicketWasSavedEvent} from './Event/TicketWasSavedEvent';
import type {WorklogMutationResult} from './Type/types';

// DELETE /api/project/{projectId}/ticket/{ticketId}/worklog/{worklogId} -
// same timeSpent/timeSpentAll cascade as logging, just subtracting the
// deleted entry's minutes instead of adding (see TicketWorklogSection).
const useDeleteWorklogHook = () => {
  const {request} = useRequestHook();

  const deleteWorklog = async (projectId: string, ticketId: string, worklogId: string): Promise<WorklogMutationResult> => {
    try {
      await request<undefined, void>({
        type: RequestMethod.DELETE,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/worklog/${worklogId}`,
      });

      eventBus.dispatch(new TicketWasSavedEvent('Time entry deleted.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new TicketSaveFailedEvent(getApiErrorMessage(error, "Couldn't delete the time entry — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {deleteWorklog};
};

export default useDeleteWorklogHook;
