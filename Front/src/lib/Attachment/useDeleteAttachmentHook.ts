import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {AttachmentSaveFailedEvent} from './Event/AttachmentSaveFailedEvent';
import {AttachmentWasSavedEvent} from './Event/AttachmentWasSavedEvent';
import {attachmentPath} from './attachmentPath';
import type {AttachmentMutationResult} from './Type/types';

// DELETE {basePath}/attachment/{attachmentId}
const useDeleteAttachmentHook = () => {
  const {request} = useRequestHook();

  const deleteAttachment = async (basePath: string, attachmentId: string): Promise<AttachmentMutationResult> => {
    try {
      await request<undefined, void>({
        type: RequestMethod.DELETE,
        endpoint: attachmentPath(basePath, attachmentId),
      });

      eventBus.dispatch(new AttachmentWasSavedEvent('Attachment deleted.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new AttachmentSaveFailedEvent(getApiErrorMessage(error, "Couldn't delete the attachment — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {deleteAttachment};
};

export default useDeleteAttachmentHook;
