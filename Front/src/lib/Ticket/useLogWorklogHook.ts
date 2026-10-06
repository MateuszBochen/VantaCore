import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {TicketSaveFailedEvent} from './Event/TicketSaveFailedEvent';
import {TicketWasSavedEvent} from './Event/TicketWasSavedEvent';
import type {WorklogMutationResult} from './Type/types';

// `date` (not `dateTime`) is deliberate - the wire field name the backend's
// WorklogRequest DTO still expects, confirmed against the Api project (only
// the underlying Java type moved from LocalDate to LocalDateTime, the JSON
// key didn't change). The value itself must be a zoneless local datetime
// string ("yyyy-MM-ddTHH:mm:ss") - see dateRange.ts's comment on why never
// `.toISOString()`.
export type LogWorklogPayload = {
  minutes: number;
  date: string;
  note: string;
};

// POST /api/project/{projectId}/ticket/{ticketId}/worklog - shared by manual
// entry (TicketWorklogSection) and the stopwatch's Stop button
// (TicketWorklogStopwatch), which logs the elapsed time through this same
// endpoint rather than having its own. Every logged entry is stored as its
// own history row server-side and rolls up into this ticket's own
// timeSpent/timeSpentAll (and its ancestors' timeSpentAll, up to the root) -
// the frontend doesn't recompute that cascade itself, callers just bump
// their local ticket's own two fields to match (see TicketWorklogSection).
const useLogWorklogHook = () => {
  const {request} = useRequestHook();

  const logWorklog = async (projectId: string, ticketId: string, payload: LogWorklogPayload): Promise<WorklogMutationResult> => {
    try {
      await request<LogWorklogPayload, void>({
        type: RequestMethod.POST,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/worklog`,
        data: payload,
      });

      eventBus.dispatch(new TicketWasSavedEvent('Time logged.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new TicketSaveFailedEvent(getApiErrorMessage(error, "Couldn't log time — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {logWorklog};
};

export default useLogWorklogHook;
