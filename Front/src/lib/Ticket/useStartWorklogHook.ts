import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';

export type StartWorklogPayload = {
  startedAt: string;
};

// POST /api/project/{projectId}/ticket/{ticketId}/worklog/start - the Play
// button. The backend records this as "work started" and broadcasts a
// worklog.started event over the websocket to this same user's other
// sessions, so any other tab/device with a timer running elsewhere commits
// and stops it - only one active timer per user (see
// WorklogWasStartedRemoteEvent). No toast here: this fires ambiently on
// every Play click and a failure doesn't affect the local stopwatch UI, it
// just means the cross-tab sync won't fire for this session.
const useStartWorklogHook = () => {
  const {request} = useRequestHook();

  const startWorklog = async (projectId: string, ticketId: string, payload: StartWorklogPayload): Promise<void> => {
    try {
      await request<StartWorklogPayload, void>({
        type: RequestMethod.POST,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/worklog/start`,
        data: payload,
      });
    } catch (error) {
      if (!isAxiosError(error)) {
        throw error;
      }
    }
  };

  return {startWorklog};
};

export default useStartWorklogHook;
