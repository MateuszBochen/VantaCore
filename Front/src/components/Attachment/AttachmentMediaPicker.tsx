import {useEffect, useState} from 'react';
import {ImageIcon, Video as VideoIcon} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Uploader} from '@/components/Uploader';
import useListAttachmentsHook from '@/lib/Attachment/useListAttachmentsHook';
import useUploadAttachmentHook from '@/lib/Attachment/useUploadAttachmentHook';
import useAttachmentPreviewUrls from '@/lib/Attachment/useAttachmentPreviewUrls';
import {attachmentDownloadPath} from '@/lib/Attachment/attachmentPath';
import {MAX_ATTACHMENT_SIZE_BYTES} from '@/lib/Attachment/attachmentLimits';
import type {Attachment} from '@/lib/Attachment/Type/types';

type AttachmentMediaPickerProps = {
  // See AttachmentsSection - the owner's {basePath}/attachment[/{id}] prefix.
  basePath: string;
  // Shown above the Uploader - callers give it something owner-specific
  // ("Ticket attachments", "Sub-project attachments", ...) since this
  // component itself has no idea what kind of owner basePath points at.
  label?: string;
  // Gets the same self-describing path AttachmentImage/AttachmentVideo's
  // NodeViews later parse back out (see attachmentDownloadPath), plus the
  // attachment's own contentType so the caller (Toolbar's single "Insert
  // image or video" button) knows which node to insert - the picker itself
  // has no opinion on that, it just reports what was picked.
  onSelect: (src: string, label: string, contentType: string) => void;
};

// MarkdownEditor's single media toolbar button's "small file manager" -
// browse this owner's own image/video attachments (upload a new one right
// here too) instead of only being able to paste an external URL. One picker
// for both media types (not a separate image/video button+picker pair) -
// there's only one "insert media" toolbar slot, mirroring how a real file
// manager doesn't split by file type either. Handed to
// MarkdownEditorProps.imagePicker as a render slot (see TicketEditor/
// TicketCommentsSection, SubProjectDocumentationPage,
// PlatformDocumentationSection) rather than MarkdownEditor/Toolbar importing
// this directly - they have no business knowing about tickets/sub-projects/
// attachments or the stack (list/upload/preview hooks) this pulls in, and
// Toolbar only calls the slot while its popover is open, so this stays
// exactly as lazy as before.
const AttachmentMediaPicker = ({basePath, label = 'Attachments', onSelect}: AttachmentMediaPickerProps) => {
  const {listAttachments} = useListAttachmentsHook();
  const {uploadAttachment} = useUploadAttachmentHook();

  const [attachments, setAttachments] = useState<Attachment[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refetch = () => {
    listAttachments(basePath).then((result) => {
      setAttachments(result.success ? result.attachments : []);
    });
  };

  useEffect(() => {
    let cancelled = false;

    listAttachments(basePath).then((result) => {
      if (!cancelled) {
        setAttachments(result.success ? result.attachments : []);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listAttachments is a thin useRequestHook wrapper recreated every render
  }, [basePath]);

  const media = (attachments ?? []).filter(
    // contentType can be null (e.g. imported attachments) - not offered as media then.
    (attachment) => (attachment.contentType ?? '').startsWith('image/') || (attachment.contentType ?? '').startsWith('video/'),
  );
  // Real thumbnails only for images - useAttachmentPreviewUrls fetches full
  // blobs to render them, not worth the extra cost for video previews here
  // (see AttachmentImage.tsx's own blob-fetch comment on the 25MB limit);
  // videos just get a generic icon below instead.
  const images = media.filter((attachment) => (attachment.contentType ?? '').startsWith('image/'));
  const previewUrls = useAttachmentPreviewUrls(basePath, images);

  const handlePick = (attachment: Attachment) => {
    onSelect(attachmentDownloadPath(basePath, attachment.id), attachment.fileName, attachment.contentType ?? '');
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>

      <Uploader
        multiple
        maxSizeBytes={MAX_ATTACHMENT_SIZE_BYTES}
        triggerLabel="Upload new"
        onUpload={(file, onProgress, id) => uploadAttachment(basePath, id, file, onProgress)}
        onSettled={refetch}
      />

      {attachments === null ? (
        <p className="text-xs text-zinc-500">Loading…</p>
      ) : media.length === 0 ? (
        <p className="text-xs text-zinc-500">No images or videos attached yet.</p>
      ) : (
        <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto">
          {media.map((attachment) => {
            const isVideo = (attachment.contentType ?? '').startsWith('video/');

            return (
              <Button
                key={attachment.id}
                type="button"
                variant="ghost"
                disableRipple
                title={attachment.fileName}
                onClick={() => setSelectedId(attachment.id)}
                onDoubleClick={() => handlePick(attachment)}
                className={`aspect-square h-auto min-w-0 shrink-0 rounded-md border p-0 ${
                  selectedId === attachment.id ? 'border-cyan-400' : 'border-white/10'
                }`}
              >
                {isVideo ? (
                  <VideoIcon className="h-4 w-4 text-zinc-600" />
                ) : previewUrls[attachment.id] ? (
                  <img src={previewUrls[attachment.id]} alt={attachment.fileName} className="h-full w-full rounded object-cover" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-zinc-600" />
                )}
              </Button>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={!selectedId}
          onClick={() => {
            const attachment = media.find((candidate) => candidate.id === selectedId);

            if (attachment) {
              handlePick(attachment);
            }
          }}
        >
          Insert
        </Button>
      </div>
    </div>
  );
};

export default AttachmentMediaPicker;
