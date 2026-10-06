import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {TicketSaveFailedEvent} from './Event/TicketSaveFailedEvent';
import {TicketWasSavedEvent} from './Event/TicketWasSavedEvent';
import type {CommentMutationResult} from './Type/types';
import type {AddCommentPayload} from './useAddCommentHook';

// PUT /api/project/{projectId}/ticket/{ticketId}/comment/{commentId}
const useUpdateCommentHook = () => {
  const {request} = useRequestHook();

  const updateComment = async (
    projectId: string,
    ticketId: string,
    commentId: string,
    payload: AddCommentPayload,
  ): Promise<CommentMutationResult> => {
    try {
      await request<AddCommentPayload, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/comment/${commentId}`,
        data: payload,
      });

      eventBus.dispatch(new TicketWasSavedEvent('Comment updated.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new TicketSaveFailedEvent(getApiErrorMessage(error, "Couldn't update the comment — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {updateComment};
};

export default useUpdateCommentHook;
