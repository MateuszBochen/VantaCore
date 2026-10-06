import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {SprintActionFailedEvent} from './Event/SprintActionFailedEvent';
import type {SprintActionResult} from './Type/types';

export type SprintTicketAction = 'ADD' | 'REMOVE';

type PatchSprintTicketsPayload = {
  tickets: {ticketId: string; action: SprintTicketAction}[];
};

// PATCH /api/board/{boardId}/sprint/{sprintId} - confirmed 2026-08-19. This
// is the sprint side's own source of truth for ticket membership
// (Sprint.tickets) - Ticket.sprint (from GET .../ticket) is a read-only
// denormalized view of the same relationship, not written by the ticket's
// own PUT (see useSaveTicketHook's SaveTicketPayload). Batchable on the
// wire, but every caller so far (TicketFieldsSidebar's Sprint field) only
// ever moves one ticket at a time.
const usePatchSprintTicketsHook = () => {
  const {request} = useRequestHook();

  const patchSprintTickets = async (boardId: string, sprintId: string, ticketId: string, action: SprintTicketAction): Promise<SprintActionResult> => {
    try {
      await request<PatchSprintTicketsPayload, void>({
        type: RequestMethod.PATCH,
        endpoint: `/api/board/${boardId}/sprint/${sprintId}`,
        data: {tickets: [{ticketId, action}]},
      });

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        // 422 carries a real reason (e.g. the sprint's already started and
        // the board doesn't allow adding scope mid-sprint) - show that
        // instead of a generic message whenever it's there.
        const fallback = action === 'ADD' ? "Couldn't add the ticket to that sprint — please try again." : "Couldn't remove the ticket from its sprint — please try again.";
        eventBus.dispatch(new SprintActionFailedEvent(getApiErrorMessage(error, fallback)));
        return {success: false};
      }

      throw error;
    }
  };

  return {patchSprintTickets};
};

export default usePatchSprintTicketsHook;
