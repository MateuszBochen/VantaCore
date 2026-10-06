import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {attachmentListPath} from './attachmentPath';
import type {ListAttachmentsResponse, ListAttachmentsResult} from './Type/types';

const useListAttachmentsHook = () => {
  const {request} = useRequestHook();

  const listAttachments = async (basePath: string): Promise<ListAttachmentsResult> => {
    try {
      const response = await request<undefined, ListAttachmentsResponse>({
        type: RequestMethod.GET,
        endpoint: attachmentListPath(basePath),
      });

      const attachments = response.data.data.map((item) => ({
        id: item.resource.id,
        fileName: item.resource.originalFilename,
        size: item.resource.sizeBytes,
        contentType: item.resource.contentType,
        createdAt: item.resource.uploadedAt,
        authorId: item.resource.uploadedByUserId,
      }));

      // Newest first, same convention as useListCommentsHook/useListWorklogHook.
      attachments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return {success: true, attachments};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listAttachments};
};

export default useListAttachmentsHook;
