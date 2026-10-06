import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import type {BulkUpdateTicketsResult, TicketBulkAction, TicketBulkActionResult} from './Type/types';

type BulkUpdateTicketsPayload = {
  ticketIds: string[];
  action: TicketBulkAction;
};

type BulkUpdateTicketsResponse = {
  results: TicketBulkActionResult[];
};

const useBulkUpdateTicketsHook = () => {
  const {request} = useRequestHook();

  const bulkUpdateTickets = async (
    projectId: string,
    ticketIds: string[],
    action: TicketBulkAction,
  ): Promise<BulkUpdateTicketsResult> => {
    try {
      const response = await request<BulkUpdateTicketsPayload, BulkUpdateTicketsResponse>({
        type: RequestMethod.POST,
        endpoint: `/api/project/${projectId}/ticket/bulk`,
        data: {ticketIds, action},
      });

      return {success: true, results: response.data.results};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false, message: getApiErrorMessage(error, "Couldn't apply the bulk action — please try again.")};
      }

      throw error;
    }
  };

  return {bulkUpdateTickets};
};

export default useBulkUpdateTicketsHook;
