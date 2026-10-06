import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {Download, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import useGetAttachmentBlobHook from '@/lib/Attachment/useGetAttachmentBlobHook';
import {getAttachmentPreviewKind, resolveAttachmentMimeType} from '@/lib/Attachment/attachmentPreviewKind';
import type {Attachment} from '@/lib/Attachment/Type/types';
import ZoomableImage from './ZoomableImage';

type AttachmentPreviewLightboxProps = {
  basePath: string;
  attachment: Attachment;
  downloading: boolean;
  onDownload: () => void;
  onClose: () => void;
};

// Tagged by the attachment id it was fetched for, so switching attachments
// never flashes the previous file's blob.
type BlobState = {
  attachmentId: string;
  objectUrl: string | null;
};

// Fullscreen preview for AttachmentsSection - same backdrop look as the
// MarkdownEditor's openAttachmentLightbox, but a React portal since it needs
// a header (file name, Download, Close) and an async blob fetch. The blob is
// re-wrapped with the resolved MIME type: the download endpoint may answer
// application/octet-stream, and an <iframe> only renders a PDF when the
// object URL's type says so.
const AttachmentPreviewLightbox = ({basePath, attachment, downloading, onDownload, onClose}: AttachmentPreviewLightboxProps) => {
  const {getAttachmentBlob} = useGetAttachmentBlobHook();
  const [blobState, setBlobState] = useState<BlobState | null>(null);
  const kind = getAttachmentPreviewKind(attachment);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    getAttachmentBlob(basePath, attachment.id).then((result) => {
      if (cancelled) {
        return;
      }

      if (result.success) {
        const type = resolveAttachmentMimeType(attachment) ?? result.blob.type;
        objectUrl = URL.createObjectURL(new Blob([result.blob], {type}));
      }

      setBlobState({attachmentId: attachment.id, objectUrl});
    });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getAttachmentBlob is a thin useRequestHook wrapper recreated every render
  }, [basePath, attachment.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loading = blobState?.attachmentId !== attachment.id;
  const objectUrl = loading ? null : blobState!.objectUrl;

  const renderContent = () => {
    if (loading) {
      return <p className="text-sm text-zinc-400">Loading preview…</p>;
    }

    if (!objectUrl) {
      return <p className="text-sm text-zinc-400">Couldn't load the preview.</p>;
    }

    switch (kind) {
      case 'image':
        return <ZoomableImage src={objectUrl} alt={attachment.fileName} onBackdropClick={onClose} />;
      case 'video':
        return <video src={objectUrl} controls autoPlay className="max-h-full max-w-full rounded-lg shadow-2xl" />;
      case 'audio':
        return <audio src={objectUrl} controls autoPlay className="w-full max-w-lg" />;
      case 'pdf':
        return <iframe src={objectUrl} title={attachment.fileName} className="h-full w-full rounded-lg border-0 bg-white shadow-2xl" />;
      default:
        return null;
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/85"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{attachment.fileName}</span>

        <Button
          variant="ghost"
          size="icon"
          disableRipple
          leftIcon={<Download className="h-4 w-4" />}
          onClick={onDownload}
          loading={downloading}
          className="h-8 w-8 min-w-0 shrink-0 rounded-md text-zinc-300 hover:bg-white/10 hover:text-cyan-300"
        />
        <Button
          variant="ghost"
          size="icon"
          disableRipple
          leftIcon={<X className="h-4 w-4" />}
          onClick={onClose}
          className="h-8 w-8 min-w-0 shrink-0 rounded-md text-zinc-300 hover:bg-white/10 hover:text-white"
        />
      </div>

      <div
        className="flex min-h-0 flex-1 items-center justify-center px-8 pb-8"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        {renderContent()}
      </div>
    </div>,
    document.body,
  );
};

export default AttachmentPreviewLightbox;
