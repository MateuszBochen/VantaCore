import {MarkdownEditor} from '@/components/MarkdownEditor';
import {AttachmentMediaPicker} from '@/components/Attachment';

type DescriptionWidgetProps = {
  description: string;
  onChange: (description: string) => void;
  // Absent for isNew (no ticket id to attach files to yet) - same gate as
  // TicketEditor's own attachmentBasePath.
  attachmentBasePath: string | null;
  // `KEY Title` - heading and file name of the toolbar's "Export to PDF".
  exportTitle: string;
};

// Viewing an older saved version (historyVersion) never reaches the grid at
// all - TicketEditor swaps to its own simple read-only MarkdownPreview +
// TicketHistorySummary pair for that, same as before this widget system
// existed, regardless of which layout slot is active. So this widget only
// ever needs the live-editing case.
//
// MarkdownEditor already renders its own bordered/backgrounded card
// (rounded-lg border bg-(--input-background)) - unlike every other widget,
// this one is deliberately NOT wrapped in TicketWidgetCard, which would just
// double the border.
const DescriptionWidget = ({description, onChange, attachmentBasePath, exportTitle}: DescriptionWidgetProps) => (
  <MarkdownEditor
    className="h-full"
    value={description}
    onChange={onChange}
    placeholder="Describe the ticket…"
    exportTitle={exportTitle}
    imagePicker={
      attachmentBasePath
        ? (onSelect) => <AttachmentMediaPicker basePath={attachmentBasePath} label="Ticket attachments" onSelect={onSelect} />
        : undefined
    }
  />
);

export default DescriptionWidget;
