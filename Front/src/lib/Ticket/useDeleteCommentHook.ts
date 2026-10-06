import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {TicketSaveFailedEvent} from './Event/TicketSaveFailedEvent';
import {TicketWasSavedEvent} from './Event/TicketWasSavedEvent';
import type {CommentMutationResult} from './Type/types';

// DELETE /api/project/{projectId}/ticket/{ticketId}/comment/{commentId}
const useDeleteCommentHook = () => {
  const {request} = useRequestHook();

  const deleteComment = async (projectId: string, ticketId: string, commentId: string): Promise<CommentMutationResult> => {
    try {
      await request<undefined, void>({
        type: RequestMethod.DELETE,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/comment/${commentId}`,
      });

      eventBus.dispatch(new TicketWasSavedEvent('Comment deleted.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new TicketSaveFailedEvent(getApiErrorMessage(error, "Couldn't delete the comment — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {deleteComment};
};

export default useDeleteCommentHook;
