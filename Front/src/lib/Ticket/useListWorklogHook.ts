import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListWorklogResponse, ListWorklogResult} from './Type/types';

const useListWorklogHook = () => {
  const {request} = useRequestHook();

  // GET .../worklog - only this ticket's own entries, not its descendants'.
  const listWorklog = async (projectId: string, ticketId: string): Promise<ListWorklogResult> => {
    try {
      const response = await request<undefined, ListWorklogResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/worklog`,
      });

      return {
        success: true,
        entries: response.data.data.map((item) => ({
          id: item.resource.id,
          minutes: item.resource.minutes,
          dateTime: item.resource.date,
          note: item.resource.note,
          actorId: item.resource.actor.id,
        })),
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listWorklog};
};

export default useListWorklogHook;
