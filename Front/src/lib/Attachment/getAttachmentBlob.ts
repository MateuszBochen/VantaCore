import {isAxiosError} from 'axios';
import {apiRequest} from '../Request/apiRequest';
import {RequestMethod} from '../Request/Type/types';
import {attachmentDownloadPath} from './attachmentPath';

export type GetAttachmentBlobResult =
  | {success: true; blob: Blob}
  | {success: false};

// GET {basePath}/attachment/{attachmentId}/download, authenticated -
// confirmed 2026-08-09 there's no unauthenticated endpoint for attachment
// bytes for any owner type. A plain <img src>/<a href> can't attach the
// Authorization header, so this pulls the file down as a Blob through the
// same JWT-bearing apiRequest() everything else uses - same lightweight
// blob-in-memory pattern Gmail/Slack/Jira use for attachment downloads, one
// file at a time, fine at the 25MB limit.
//
// A plain function, not a hook, deliberately - tiptap/AttachmentImage and
// tiptap/AttachmentVideo's node views need this too, and a vanilla
// ProseMirror NodeView can't call hooks. useGetAttachmentBlobHook below is
// just this wrapped for the app's hook-calling convention, for every OTHER
// (React-component) caller (AttachmentsSection, AttachmentMediaPicker,
// useAttachmentPreviewUrls, useDownloadAttachmentHook).
export const getAttachmentBlobByPath = async (downloadPath: string): Promise<GetAttachmentBlobResult> => {
  try {
    const response = await apiRequest<undefined, Blob>({
      type: RequestMethod.GET,
      endpoint: downloadPath,
      responseType: 'blob',
    });

    return {success: true, blob: response.data};
  } catch (error) {
    if (isAxiosError(error)) {
      return {success: false};
    }

    throw error;
  }
};

// Convenience wrapper for every caller that already has (basePath,
// attachmentId) rather than a pre-built download path - AttachmentImage's
// NodeView is the one exception (it only has the `src` it stored, already a
// full path, and calls getAttachmentBlobByPath directly instead).
export const getAttachmentBlob = (basePath: string, attachmentId: string): Promise<GetAttachmentBlobResult> =>
  getAttachmentBlobByPath(attachmentDownloadPath(basePath, attachmentId));
