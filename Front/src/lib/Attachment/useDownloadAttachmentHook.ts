import useGetAttachmentBlobHook from './useGetAttachmentBlobHook';
import {eventBus} from '../EventBus/EventBus';
import {AttachmentSaveFailedEvent} from './Event/AttachmentSaveFailedEvent';

// Forces a Save As via a throwaway object URL - see useGetAttachmentBlobHook
// for why this has to go through an authenticated blob fetch rather than a
// plain <a href>.
const useDownloadAttachmentHook = () => {
  const {getAttachmentBlob} = useGetAttachmentBlobHook();

  const downloadAttachment = async (basePath: string, attachmentId: string, fileName: string): Promise<boolean> => {
    const result = await getAttachmentBlob(basePath, attachmentId);

    if (!result.success) {
      eventBus.dispatch(new AttachmentSaveFailedEvent("Couldn't download the attachment — please try again."));
      return false;
    }

    const objectUrl = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);

    return true;
  };

  return {downloadAttachment};
};

export default useDownloadAttachmentHook;
