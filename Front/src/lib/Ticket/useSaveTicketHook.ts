import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {TicketSaveFailedEvent} from './Event/TicketSaveFailedEvent';
import {TicketWasSavedEvent} from './Event/TicketWasSavedEvent';
import {ticketCache} from './TicketCache';
import type {SaveTicketResult, Ticket} from './Type/types';

type SaveTicketOptions = {
  // On create, the server assigns fields we don't know client-side (at
  // least `key`, e.g. VC-1042) - caching the draft we just sent would make
  // useGetTicketHook's cache check return that stale draft forever instead
  // of ever doing a real fetch, so the real key (and anything else the
  // server filled in) would never be learned. Skip the cache write here and
  // let the very next getTicket() call go to the network for real.
  isNew?: boolean;
};

// sprint has its own dedicated endpoint (PATCH /api/board/{boardId}/sprint/
// {sprintId} - see usePatchSprintTicketsHook), same reasoning as
// useSaveProjectHook excluding platformDocumentation/subProjects: sprint
// membership carries Board-level rules (e.g. "can't add to an already-
// started sprint") that belong to the Sprint aggregate, not this generic
// ticket PUT.
type SaveTicketPayload = Omit<Ticket, 'sprint'>;

const useSaveTicketHook = () => {
  const {request} = useRequestHook();

  // Upsert, same as useSaveSubProjectDocumentationHook - PUT is idempotent
  // either way since the id is always client-generated. Dispatches its own
  // success/failure events (unlike useSaveProjectHook, which leaves that to
  // the calling component) so callers only deal with the result for
  // navigation, not with notifying the user.
  const saveTicket = async (projectId: string, ticket: Ticket, options: SaveTicketOptions = {}): Promise<SaveTicketResult> => {
    const {sprint: _sprint, ...payload} = ticket;

    try {
     await request<SaveTicketPayload, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/project/${projectId}/ticket/${ticket.id}`,
        data: payload,
      });

      if (!options.isNew) {
        ticketCache.set(ticket);
      }

      eventBus.dispatch(new TicketWasSavedEvent('Ticket saved.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new TicketSaveFailedEvent(getApiErrorMessage(error, "Couldn't save changes — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {saveTicket};
};

export default useSaveTicketHook;
