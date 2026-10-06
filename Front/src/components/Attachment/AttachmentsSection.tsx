import {useEffect, useState} from 'react';
import {Download, Paperclip, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {UserChip} from '@/components/ui/user-chip';
import {Uploader} from '@/components/Uploader';
import useListAttachmentsHook from '@/lib/Attachment/useListAttachmentsHook';
import useUploadAttachmentHook from '@/lib/Attachment/useUploadAttachmentHook';
import useDeleteAttachmentHook from '@/lib/Attachment/useDeleteAttachmentHook';
import useDownloadAttachmentHook from '@/lib/Attachment/useDownloadAttachmentHook';
import useAttachmentPreviewUrls from '@/lib/Attachment/useAttachmentPreviewUrls';
import {MAX_ATTACHMENT_SIZE_BYTES} from '@/lib/Attachment/attachmentLimits';
import formatFileSize from '@/lib/formatFileSize';
import {getAttachmentPreviewKind} from '@/lib/Attachment/attachmentPreviewKind';
import AttachmentPreviewLightbox from './AttachmentPreviewLightbox';
import type {Attachment} from '@/lib/Attachment/Type/types';

type AttachmentsSectionProps = {
  // The owner's own {basePath}/attachment[/{id}][/download] prefix - e.g.
  // `/api/project/{projectId}/ticket/{ticketId}`,
  // `/api/project/{projectId}/sub-project/{subProjectId}`, or
  // `/api/project/{projectId}/documentation` (no id of its own - platform
  // docs are 1:1 with the project). Whatever owns this section just needs to
  // build the right prefix, everything else here is identical.
  basePath: string;
};

// Tagged by the basePath it was fetched for, same convention as
// TicketWorklogSection/TicketCommentsSection (there tagged by ticketId -
// basePath already uniquely identifies the owner here, no separate id
// needed).
type FetchState = {
  basePath: string;
  attachments: Attachment[];
};

const formatTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? isoString : date.toLocaleString();
};

// A Stepper step's "Attachments" tab body (see TicketEditor,
// SubProjectDocumentationPage, PlatformDocumentationSection), fetched lazily
// from its own endpoint rather than embedded on the owner resource - same
// precedent as Ticket Comments/Worklog/Test Cases. No edit action - an
// attachment is replaced by deleting and re-uploading, not patched in place.
//
// Every byte - a full Download or just an image thumbnail - comes from the
// one authenticated {basePath}/attachment/{id}/download endpoint (see
// useGetAttachmentBlobHook's comment for why: this backend has no
// unauthenticated file endpoint a plain <img>/<a> could hit directly).
// Thumbnails are fetched as blobs lazily via useAttachmentPreviewUrls
// (shared with the MarkdownEditor image picker's browse grid).
const AttachmentsSection = ({basePath}: AttachmentsSectionProps) => {
  const {listAttachments} = useListAttachmentsHook();
  const {uploadAttachment} = useUploadAttachmentHook();
  const {deleteAttachment} = useDeleteAttachmentHook();
  const {downloadAttachment} = useDownloadAttachmentHook();

  const [fetched, setFetched] = useState<FetchState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const refetch = () => {
    listAttachments(basePath).then((result) => {
      setFetched({basePath, attachments: result.success ? result.attachments : []});
    });
  };

  useEffect(() => {
    let cancelled = false;

    listAttachments(basePath).then((result) => {
      if (!cancelled) {
        setFetched({basePath, attachments: result.success ? result.attachments : []});
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listAttachments is a thin useRequestHook wrapper recreated every render
  }, [basePath]);

  const loading = fetched?.basePath !== basePath;
  const attachments = loading ? [] : fetched!.attachments;
  const previewUrls = useAttachmentPreviewUrls(basePath, attachments);
  const previewAttachment = attachments.find((attachment) => attachment.id === previewId) ?? null;

  const handleDelete = (attachment: Attachment) => {
    setDeletingId(attachment.id);

    deleteAttachment(basePath, attachment.id)
      .then((result) => {
        if (result.success) {
          refetch();
        }
      })
      .finally(() => setDeletingId(null));
  };

  const handleDownload = (attachment: Attachment) => {
    setDownloadingId(attachment.id);

    downloadAttachment(basePath, attachment.id, attachment.fileName).finally(() => setDownloadingId(null));
  };

  // Images/videos/audio/PDFs open in a preview first (with its own Download
  // button); anything the browser can't render inline downloads straight away.
  const handleOpen = (attachment: Attachment) => {
    if (getAttachmentPreviewKind(attachment)) {
      setPreviewId(attachment.id);
    } else {
      handleDownload(attachment);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="pt-1.5 text-sm font-semibold text-zinc-200">Attachments</p>

        <Uploader
          multiple
          align="end"
          className="w-full max-w-xs"
          maxSizeBytes={MAX_ATTACHMENT_SIZE_BYTES}
          onUpload={(file, onProgress, id) => uploadAttachment(basePath, id, file, onProgress)}
          onSettled={refetch}
        />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading attachments…</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-zinc-500">No attachments yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {attachments.map((attachment) => {
            const previewUrl = previewUrls[attachment.id];

            return (
              <div
                key={attachment.id}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm"
              >
                {previewUrl ? (
                  <Button
                    variant="ghost"
                    disableRipple
                    onClick={() => handleOpen(attachment)}
                    className="h-8 w-8 min-w-0 shrink-0 rounded p-0"
                  >
                    <img src={previewUrl} alt={attachment.fileName} className="h-8 w-8 rounded object-cover" />
                  </Button>
                ) : (
                  <Paperclip className="h-4 w-4 shrink-0 text-zinc-500" />
                )}

                <button
                  type="button"
                  onClick={() => handleOpen(attachment)}
                  className="min-w-0 flex-1 cursor-pointer truncate text-left text-zinc-200 hover:text-cyan-300"
                >
                  {attachment.fileName}
                </button>

                <span className="shrink-0 text-xs text-zinc-500">{formatFileSize(attachment.size)}</span>
                <UserChip userId={attachment.authorId} />
                <span className="hidden shrink-0 text-xs text-zinc-500 sm:inline">{formatTimestamp(attachment.createdAt)}</span>

                <Button
                  variant="ghost"
                  size="icon"
                  disableRipple
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                  onClick={() => handleDownload(attachment)}
                  loading={downloadingId === attachment.id}
                  className="h-6 w-6 min-w-0 shrink-0 rounded-md text-zinc-500 hover:bg-white/10 hover:text-cyan-300"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  disableRipple
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => handleDelete(attachment)}
                  loading={deletingId === attachment.id}
                  className="h-6 w-6 min-w-0 shrink-0 rounded-md text-zinc-500 hover:bg-white/10 hover:text-red-400"
                />
              </div>
            );
          })}
        </div>
      )}

      {previewAttachment && (
        <AttachmentPreviewLightbox
          basePath={basePath}
          attachment={previewAttachment}
          downloading={downloadingId === previewAttachment.id}
          onDownload={() => handleDownload(previewAttachment)}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>
  );
};

export default AttachmentsSection;
