import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {ticketCache} from './TicketCache';
import type {GetTicketResponse, GetTicketResult} from './Type/types';

const useGetTicketHook = () => {
  const {request} = useRequestHook();

  const getTicket = async (projectId: string, ticketId: string): Promise<GetTicketResult> => {
    const cached = ticketCache.get(ticketId);

    if (cached) {
      return {success: true, ticket: cached};
    }

    try {
      const response = await request<undefined, GetTicketResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}`,
      });

      const ticket = response.data.resource;
      ticketCache.set(ticket);

      return {success: true, ticket};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {getTicket};
};

export default useGetTicketHook;
