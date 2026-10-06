import {useRef, useState} from 'react';
import {Upload, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {cn} from '@/lib/utils';
import formatFileSize from '@/lib/formatFileSize';

// Bytes, not percent - entries of different sizes can't be averaged into a
// correct aggregate from percentages alone, only Uploader itself sums loaded/
// total across every file in the batch (see overallPercent below). `id` is a
// uuid Uploader mints per file before calling this - callers whose backend
// wants a client-generated resource id (e.g. Ticket attachments: POST
// .../attachment/{attachmentId}) reuse it instead of generating their own.
export type UploaderUploadFn = (
  file: File,
  onProgress: (loaded: number, total: number) => void,
  id: string,
) => Promise<{success: boolean}>;

export type UploaderProps = {
  // Also toggles whether a second, aggregate bar renders above the per-file
  // ones - pointless when there's only ever one file, so a single-file
  // upload (whether multiple is false, or true but the user only picked
  // one) shows just that one bar.
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  // Rejected client-side before onUpload is ever called - e.g. attachments'
  // 25MB backend limit (see lib/Attachment/attachmentLimits), so an
  // oversized file fails instantly instead of after a slow partial upload.
  maxSizeBytes?: number;
  onUpload: UploaderUploadFn;
  // Fired once every file in the current batch has settled (success or
  // error) - the natural place for a caller to refetch its own list, e.g.
  // AttachmentsSection re-listing attachments once uploads land.
  onSettled?: () => void;
  triggerLabel?: string;
  // Which edge the trigger button hugs inside the uploader's own box - 'end'
  // when it sits in a right-aligned header (e.g. AttachmentsSection), where
  // the box itself is wider than the button so the progress bars below have
  // room.
  align?: 'start' | 'end';
  className?: string;
};

type UploadStatus = 'uploading' | 'done' | 'error';

type FileEntry = {
  id: string;
  file: File;
  loaded: number;
  total: number;
  status: UploadStatus;
  error?: string;
};

const percentOf = (entry: FileEntry): number => (entry.total > 0 ? Math.round((entry.loaded / entry.total) * 100) : 0);

// Generic multi/single file uploader: a trigger button + a native file
// input, with self-contained per-file progress bars (and, once more than one
// file is in the current batch, one aggregate bar summed across all of
// them). Doesn't know how to actually upload anything - `onUpload` is
// supplied by the caller (e.g. AttachmentsSection wraps
// useUploadAttachmentHook) so this stays reusable outside the Attachment
// module.
//
// New files can't be picked while something is still in flight (the trigger
// disables itself) - this is what lets pendingRef below count a single
// batch down to zero without having to track which batch each entry belongs
// to. Entries that end in error stay on screen (dismissible) even after the
// batch settles - only successful ones clear automatically - so a failure
// doesn't flash past unseen.
const Uploader = ({
  multiple = false,
  accept,
  disabled = false,
  maxSizeBytes,
  onUpload,
  onSettled,
  triggerLabel = 'Upload',
  align = 'start',
  className,
}: UploaderProps) => {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const pendingRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const activelyUploading = entries.some((entry) => entry.status === 'uploading');

  const handleFilesSelected = (fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];

    if (files.length === 0) {
      return;
    }

    const newEntries: FileEntry[] = files.map((file) => {
      const tooLarge = maxSizeBytes !== undefined && file.size > maxSizeBytes;

      return {
        id: crypto.randomUUID(),
        file,
        loaded: 0,
        total: file.size,
        status: tooLarge ? 'error' : 'uploading',
        error: tooLarge ? `Too large (max ${formatFileSize(maxSizeBytes!)})` : undefined,
      };
    });

    setEntries((current) => [...current.filter((e) => e.status === 'error'), ...newEntries]);

    const toUpload = newEntries.filter((entry) => entry.status === 'uploading');

    if (toUpload.length === 0) {
      return;
    }

    pendingRef.current = toUpload.length;

    toUpload.forEach((entry) => {
      onUpload(
        entry.file,
        (loaded, total) => {
          setEntries((current) => current.map((e) => (e.id === entry.id ? {...e, loaded, total} : e)));
        },
        entry.id,
      )
        .then((result) => {
          setEntries((current) =>
            current.map((e) =>
              e.id === entry.id
                ? {...e, loaded: e.total, status: result.success ? 'done' : 'error', error: result.success ? undefined : 'Upload failed'}
                : e,
            ),
          );
        })
        .catch(() => {
          setEntries((current) => current.map((e) => (e.id === entry.id ? {...e, status: 'error', error: 'Upload failed'} : e)));
        })
        .finally(() => {
          pendingRef.current -= 1;

          if (pendingRef.current <= 0) {
            onSettled?.();
            setEntries((current) => current.filter((e) => e.status === 'error'));
          }
        });
    });
  };

  const dismissEntry = (id: string) => setEntries((current) => current.filter((e) => e.id !== id));

  const uploadingEntries = entries.filter((entry) => entry.status === 'uploading');
  const totalLoaded = uploadingEntries.reduce((sum, entry) => sum + entry.loaded, 0);
  const totalSize = uploadingEntries.reduce((sum, entry) => sum + entry.total, 0);
  const overallPercent = totalSize > 0 ? Math.round((totalLoaded / totalSize) * 100) : 0;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          // Clears the picked file(s) so choosing the exact same file again
          // still fires onChange next time.
          e.target.value = '';
        }}
      />

      <Button
        size="sm"
        leftIcon={<Upload className="h-4 w-4" />}
        onClick={() => inputRef.current?.click()}
        disabled={disabled || activelyUploading}
        loading={activelyUploading}
        className={align === 'end' ? 'self-end' : 'self-start'}
      >
        {triggerLabel}
      </Button>

      {uploadingEntries.length > 1 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Uploading {uploadingEntries.length} files…</span>
            <span>{overallPercent}%</span>
          </div>
          <Progress value={overallPercent} />
        </div>
      )}

      {entries.map((entry) => (
        <div key={entry.id} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
            <span className="min-w-0 truncate">{entry.file.name}</span>
            <span className="flex shrink-0 items-center gap-1">
              {entry.status === 'error' ? (entry.error ?? 'Failed') : `${percentOf(entry)}%`}
              {entry.status === 'error' && (
                <Button
                  variant="ghost"
                  size="icon"
                  disableRipple
                  onClick={() => dismissEntry(entry.id)}
                  aria-label={`Dismiss ${entry.file.name}`}
                  className="h-4 w-4 min-w-0 shrink-0 rounded p-0 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </span>
          </div>
          <Progress value={percentOf(entry)} barClassName={entry.status === 'error' ? 'bg-red-400' : undefined} />
        </div>
      ))}
    </div>
  );
};

export default Uploader;
