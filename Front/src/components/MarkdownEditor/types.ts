import type {ReactNode} from 'react';

export type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  // Enables the toolbar's "Insert image or video" button's "browse a picker
  // instead of pasting a URL" mode - MarkdownEditor has no idea what's
  // inside (attachments, tickets, ...), it just renders whatever JSX this
  // returns inside the popover and hands it a callback to call once the
  // caller's own UI has picked something. The picker reports both the
  // picked src AND the attachment's contentType, since one picker/button
  // covers both images and video - Toolbar uses contentType to decide
  // whether to insert an image or video node. Toolbar only invokes this
  // while that popover is actually open, so whatever the caller does in
  // here (fetching a list, uploading) stays exactly as lazy as it already
  // is. Omitted wherever there's nothing to browse (e.g. a draft ticket
  // with no id yet, or non-ticket content like docs/ADRs) - callers fall
  // back to pasting an external URL in that case.
  imagePicker?: (onSelect: (src: string, label: string, contentType: string) => void) => ReactNode;
  // Heading printed at the top of "Export to PDF" output and the print
  // dialog's default file name (e.g. a ticket's `KEY Title`, a doc's name).
  // Optional - without it the PDF is just the content, named "Document".
  exportTitle?: string;
};
