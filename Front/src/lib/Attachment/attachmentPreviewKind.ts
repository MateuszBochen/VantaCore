import type {Attachment} from './Type/types';

export type AttachmentPreviewKind = 'image' | 'video' | 'audio' | 'pdf';

// contentType can be null (e.g. Jira/Azure DevOps imports) - falls back to
// the file extension so those still get a preview where the browser can
// render one.
const EXTENSION_MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  avif: 'image/avif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  pdf: 'application/pdf',
};

export const resolveAttachmentMimeType = (attachment: Attachment): string | null => {
  if (attachment.contentType && attachment.contentType !== 'application/octet-stream') {
    return attachment.contentType;
  }

  const extension = attachment.fileName.split('.').pop()?.toLowerCase() ?? '';

  return EXTENSION_MIME_TYPES[extension] ?? attachment.contentType;
};

// null = nothing the browser can show inline - the row falls back to a plain
// download.
export const getAttachmentPreviewKind = (attachment: Attachment): AttachmentPreviewKind | null => {
  const mimeType = resolveAttachmentMimeType(attachment) ?? '';

  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }

  if (mimeType === 'application/pdf') {
    return 'pdf';
  }

  return null;
};
