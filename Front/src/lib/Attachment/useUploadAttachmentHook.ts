import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {AttachmentSaveFailedEvent} from './Event/AttachmentSaveFailedEvent';
import {AttachmentWasSavedEvent} from './Event/AttachmentWasSavedEvent';
import {attachmentPath} from './attachmentPath';
import type {AttachmentMutationResult} from './Type/types';

// POST {basePath}/attachment/{attachmentId}, normal multipart/form-data (a
// single "file" field, same as a plain <input type="file"> form post).
// attachmentId is NOT server-assigned - the frontend generates the uuid
// before uploading (see Uploader, which mints one per picked file and hands
// it back through onUpload). useRequestHook doesn't force a Content-Type, so
// axios auto-detects the FormData body and sets the multipart boundary
// header itself.
const useUploadAttachmentHook = () => {
  const {request} = useRequestHook();

  const uploadAttachment = async (
    basePath: string,
    attachmentId: string,
    file: File,
    // Bytes, not percent - Uploader sums these across files itself for its
    // aggregate bar, and a percent-only callback can't be summed correctly
    // once files differ in size.
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<AttachmentMutationResult> => {
    try {
      const data = new FormData();
      data.append('file', file);

      await request<FormData, void>({
        type: RequestMethod.POST,
        endpoint: attachmentPath(basePath, attachmentId),
        data,
        onUploadProgress: onProgress ? (event) => onProgress(event.loaded, event.total ?? file.size) : undefined,
      });

      eventBus.dispatch(new AttachmentWasSavedEvent('Attachment uploaded.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new AttachmentSaveFailedEvent(getApiErrorMessage(error, "Couldn't upload the attachment — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {uploadAttachment};
};

export default useUploadAttachmentHook;
