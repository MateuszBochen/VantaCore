import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {TicketSaveFailedEvent} from './Event/TicketSaveFailedEvent';
import {TicketWasSavedEvent} from './Event/TicketWasSavedEvent';
import type {CommentMutationResult} from './Type/types';

export type AddCommentPayload = {
  body: string;
};

const useAddCommentHook = () => {
  const {request} = useRequestHook();

  const addComment = async (projectId: string, ticketId: string, payload: AddCommentPayload): Promise<CommentMutationResult> => {
    try {
      await request<AddCommentPayload, void>({
        type: RequestMethod.POST,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/comment`,
        data: payload,
      });

      eventBus.dispatch(new TicketWasSavedEvent('Comment posted.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new TicketSaveFailedEvent(getApiErrorMessage(error, "Couldn't post the comment — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {addComment};
};

export default useAddCommentHook;
