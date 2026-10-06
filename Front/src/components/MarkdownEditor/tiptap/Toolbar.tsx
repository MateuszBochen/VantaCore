import {forwardRef, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import type {Editor} from '@tiptap/react';
import {Popover as PopoverPrimitive} from '@base-ui/react/popover';
import {
  Bold,
  Code,
  Code2,
  FileCode,
  FileDown,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Table as TableIcon,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {cn} from '@/lib/utils';
import {toastService} from '@/lib/Toast/ToastService';

// See MarkdownEditorProps.imagePicker - a render slot, not a data shape.
// Toolbar has no idea what's inside; it just calls this (only while the
// popover below is actually open) and hands it a callback to invoke once
// whatever UI it renders has picked something. One picker/button for BOTH
// images and video (not a separate video button) - contentType is what
// ImageInsertButton uses to decide setImage vs insertVideo.
type ImagePicker = (onSelect: (src: string, label: string, contentType: string) => void) => ReactNode;

type ToolbarProps = {
  editor: Editor | null;
  sourceMode: boolean;
  onToggleSourceMode: () => void;
  imagePicker?: ImagePicker;
  exportTitle?: string;
};

// Forwards its ref (onto Button, which forwards onto the underlying
// <button>) so the popover buttons below can hand it to PopoverPrimitive.
// Positioner's `anchor` prop - positioning a portaled popup against this
// button without needing PopoverPrimitive.Trigger to render it.
const ToolbarButton = forwardRef<
  HTMLButtonElement,
  {
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }
>(({active, disabled, onClick, title, children}, ref) => (
  <Button
    ref={ref}
    type="button"
    variant="ghost"
    size="icon"
    disableRipple
    disabled={disabled}
    onClick={onClick}
    title={title}
    className={cn('h-8 w-8 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground', active && 'bg-accent/20 text-accent')}
  >
    {children}
  </Button>
));
ToolbarButton.displayName = 'ToolbarButton';

// Recognizes a handful of common video file extensions so pasting a video
// URL (the fallback below, or a picker's own "or paste a URL" escape hatch)
// still inserts a video node instead of an image - there's no request/
// response involved to check a real content-type header against, this is
// the best a plain string can do. Defaults to image for anything else,
// same as this button's behavior before video support existed.
const VIDEO_URL_PATTERN = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

// With an imagePicker (see MarkdownEditorProps - e.g. TicketEditor wires up
// components/Attachment's AttachmentMediaPicker for a real ticket's own
// description/comment, SubProjectDocumentationPage/
// PlatformDocumentationSection do the same for their own owners), the
// popover defaults to whatever that renders: a small file-manager, browse/
// upload the owner's image AND video attachments, double-click (or select +
// Insert) to drop one in - inserted as an image or video node depending on
// the picked attachment's own contentType. "Or paste a media URL…"
// underneath falls back to the plain URL box for external media, or IS the
// only option when there's no picker to show (a draft ticket with no id
// yet, or non-ticket content like docs/ADRs) - same paste-a-URL behavior
// this button had before any picker existed.
const ImageInsertButton = ({editor, imagePicker}: {editor: Editor; imagePicker?: ImagePicker}) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(!imagePicker);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const insertMedia = (src: string, label: string, contentType: string) => {
    // setImage/insertVideo's insertContent leaves the node itself selected
    // (a NodeSelection, not a text cursor) when there's no text position
    // right after it to fall into - typically the case when inserting at
    // the end of the document. That's invisible (no blinking caret - "no
    // cursor") AND dangerous: typing while a node is selected in ProseMirror
    // REPLACES it, which is exactly why the node vanished the moment anyone
    // typed afterward. createParagraphNear guarantees a text position
    // exists next to it and moves the selection into it.
    if (contentType.startsWith('video/')) {
      editor.chain().focus().insertVideo({src, title: label}).createParagraphNear().run();
    } else {
      editor.chain().focus().setImage({src, alt: label}).createParagraphNear().run();
    }

    setOpen(false);
    setUrl('');
    setShowUrlInput(!imagePicker);
  };

  const handleInsertUrl = () => {
    const trimmed = url.trim();

    if (trimmed) {
      insertMedia(trimmed, '', VIDEO_URL_PATTERN.test(trimmed) ? 'video/*' : 'image/*');
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <ToolbarButton ref={triggerRef} title="Insert image or video" onClick={() => setOpen((current) => !current)}>
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>

      <PopoverPrimitive.Portal>
        {/* anchor={triggerRef}, not a Trigger - ToolbarButton stays the one
            actual <button>, this just positions the portaled popup against
            it (see the ToolbarButton comment: the whole reason it forwards
            a ref). Portaled to escape MarkdownEditor's own overflow-hidden
            root wrapper, which was clipping this popup whenever the editor
            itself was shorter than the popup's content - confirmed live on
            CWJ-21's Comments editor. */}
        <PopoverPrimitive.Positioner anchor={triggerRef} side="bottom" align="start" sideOffset={4} className="z-50">
          <PopoverPrimitive.Popup className="flex w-80 flex-col gap-2 rounded-xl border border-border bg-popover p-3 shadow-xl">
            {imagePicker && !showUrlInput ? (
              <>
                {imagePicker(insertMedia)}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUrlInput(true)}
                  className="h-auto self-start p-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                  Or paste a media URL…
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Image or video URL</p>
                <Input
                  autoFocus
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInsertUrl();
                    }
                  }}
                  placeholder="https://…"
                />
                <div className="flex justify-end gap-2">
                  {imagePicker && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowUrlInput(false)} className="mr-auto">
                      Back
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleInsertUrl} disabled={!url.trim()}>
                    Insert
                  </Button>
                </div>
              </>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

const LinkButton = ({editor}: {editor: Editor}) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    setUrl(editor.getAttributes('link').href ?? '');
    setOpen((current) => !current);
  };

  const handleApply = () => {
    const trimmed = url.trim();

    if (trimmed) {
      editor.chain().focus().extendMarkRange('link').setLink({href: trimmed}).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }

    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <ToolbarButton ref={triggerRef} active={editor.isActive('link')} title="Link" onClick={handleOpen}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner anchor={triggerRef} side="bottom" align="start" sideOffset={4} className="z-50">
          <PopoverPrimitive.Popup className="flex w-72 flex-col gap-2 rounded-xl border border-border bg-popover p-3 shadow-xl">
            <Input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApply();
                }
              }}
              placeholder="https:// (empty removes the link)"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

const DEFAULT_TABLE_ROWS = 3;
const DEFAULT_TABLE_COLS = 3;
const MAX_TABLE_DIMENSION = 20;

const clampTableDimension = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.round(parsed), 1), MAX_TABLE_DIMENSION) : fallback;
};

const TableMenuItem = ({label, onClick, destructive}: {label: string; onClick: () => void; destructive?: boolean}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn('rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted', destructive ? 'text-destructive' : 'text-foreground')}
  >
    {label}
  </button>
);

// One popover, always showing BOTH the "insert a new table" form and the
// "edit the table the cursor's in" actions - deliberately NOT branched on
// editor.isActive('table') to decide which half to show (that was the
// previous design): isActive('table') turned out to report true even with
// the cursor demonstrably outside any table (confirmed by clicking into the
// paragraph TrailingParagraph guarantees after a trailing table and
// checking the DOM directly - a ProseMirror boundary-resolution quirk right
// after a table, not something worth fighting). Showing both halves
// unconditionally sidesteps that entirely: the edit actions (addRowAfter,
// deleteColumn, ...) already no-op harmlessly when the cursor isn't
// actually inside a table, so there's nothing to gate.
const TableButton = ({editor}: {editor: Editor}) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(String(DEFAULT_TABLE_ROWS));
  const [cols, setCols] = useState(String(DEFAULT_TABLE_COLS));
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Markdown tables are line-based (`| cell |`) - there is no syntax that
  // could represent a table nested inside another table's cell, so this
  // isn't a serializer gap to fix, it's a document structure that flat
  // markdown can never round-trip. Tiptap's schema doesn't stop you from
  // inserting one anyway; tiptap-markdown's serializer then has no rule for
  // the orphaned tableRow/tableCell nodes and falls back to writing their
  // literal node names as text (`[tableRow]`, `[tableCell]`, one per row) -
  // confirmed live on VC-1041. Blocking insertion here at the source is the
  // actual fix, not trying to invent a serialization for something the
  // format can't express.
  //
  // NOT editor.isActive('table') - confirmed live (CWJ-21's Comments editor,
  // completely empty document) that it can report true with no table
  // anywhere in the doc at all, not just the previously-documented "trailing
  // paragraph right after a real table" boundary case - evidently flakier
  // than that one edge case. Walking the resolved selection's own ancestor
  // chain for an actual `table` node is unambiguous and doesn't share
  // whatever internal heuristic isActive's NodeType matching uses.
  const insideTable = (() => {
    const {$from} = editor.state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      if ($from.node(depth).type.name === 'table') {
        return true;
      }
    }
    return false;
  })();

  const handleInsert = () => {
    if (insideTable) {
      return;
    }

    const rowCount = clampTableDimension(rows, DEFAULT_TABLE_ROWS);
    const colCount = clampTableDimension(cols, DEFAULT_TABLE_COLS);

    editor.chain().focus().insertTable({rows: rowCount, cols: colCount, withHeaderRow: true}).run();
    setRows(String(DEFAULT_TABLE_ROWS));
    setCols(String(DEFAULT_TABLE_COLS));
    setOpen(false);
  };

  const runTableCommand = (run: () => void) => {
    run();
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <ToolbarButton ref={triggerRef} title="Table" onClick={() => setOpen((current) => !current)}>
        <TableIcon className="h-4 w-4" />
      </ToolbarButton>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner anchor={triggerRef} side="bottom" align="start" sideOffset={4} className="z-50">
          {/* No max-height/overflow-y-auto here (unlike e.g. Select's Popup) -
              tried that defensively and it backfired: flexbox shrinks items
              to fit a constrained max-height *before* falling back to
              scrolling, and zeroed out the "Insert" button's height entirely
              once this popup's real content (title + form + divider + 8 menu
              items) exceeded an arbitrary cap - confirmed live via
              getComputedStyle (height: 0px even with an inline style
              override, no CSS specificity fix could have addressed it, the
              cap itself was the bug). PopoverPrimitive.Positioner already
              repositions/flips this against viewport collisions on its own. */}
          <PopoverPrimitive.Popup className="flex w-56 flex-col gap-2 rounded-xl border border-border bg-popover p-3 shadow-xl">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Insert table</p>
            {insideTable ? (
              <p className="text-xs text-muted-foreground">
                Tables can{"'"}t be nested inside a table cell — markdown has no syntax for it. Click outside this table first.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Rows
                    <Input type="number" min={1} max={MAX_TABLE_DIMENSION} value={rows} onChange={(e) => setRows(e.target.value)} className="w-14" />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Cols
                    <Input type="number" min={1} max={MAX_TABLE_DIMENSION} value={cols} onChange={(e) => setCols(e.target.value)} className="w-14" />
                  </label>
                </div>
                <Button type="button" size="sm" onClick={handleInsert} className="self-end">
                  Insert
                </Button>
              </>
            )}

            <div className="my-1 border-t border-border" />

            <p className="text-xs uppercase tracking-widest text-muted-foreground">Edit current table</p>
            <div className="flex flex-col gap-0.5">
              <TableMenuItem label="Add row above" onClick={() => runTableCommand(() => editor.chain().focus().addRowBefore().run())} />
              <TableMenuItem label="Add row below" onClick={() => runTableCommand(() => editor.chain().focus().addRowAfter().run())} />
              <TableMenuItem label="Delete row" onClick={() => runTableCommand(() => editor.chain().focus().deleteRow().run())} />
              <div className="my-1 border-t border-border" />
              <TableMenuItem label="Add column before" onClick={() => runTableCommand(() => editor.chain().focus().addColumnBefore().run())} />
              <TableMenuItem label="Add column after" onClick={() => runTableCommand(() => editor.chain().focus().addColumnAfter().run())} />
              <TableMenuItem label="Delete column" onClick={() => runTableCommand(() => editor.chain().focus().deleteColumn().run())} />
              <div className="my-1 border-t border-border" />
              <TableMenuItem label="Toggle header row" onClick={() => runTableCommand(() => editor.chain().focus().toggleHeaderRow().run())} />
              <TableMenuItem label="Delete table" destructive onClick={() => runTableCommand(() => editor.chain().focus().deleteTable().run())} />
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

// Disabled in source mode - the (hidden) rich view isn't re-synced while the
// textarea is the source of truth (see MarkdownEditor's sync effect), so its
// document could be stale. The PDF module (jsPDF, autotable, fonts) is
// imported on click, so none of it weighs on the editor's own bundle.
const ExportPdfButton = ({editor, disabled, exportTitle}: {editor: Editor; disabled: boolean; exportTitle?: string}) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const {exportEditorPdf} = await import('../pdf/exportEditorPdf');
      await exportEditorPdf(editor.getJSON(), exportTitle);
    } catch (error) {
      console.error('PDF export failed:', error);
      toastService.push('error', "Couldn't export to PDF — please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <ToolbarButton disabled={disabled || exporting || editor.isEmpty} title={exporting ? 'Exporting…' : 'Export to PDF'} onClick={handleExport}>
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
    </ToolbarButton>
  );
};

// Buttons run editor commands directly (no raw markdown syntax to know) -
// the whole point of moving off the old source-first editor. "View source"
// is the escape hatch back to raw markdown text for anyone who does know it
// (or needs to paste/troubleshoot something the toolbar doesn't cover yet).
const Toolbar = ({editor, sourceMode, onToggleSourceMode, imagePicker, exportTitle}: ToolbarProps) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted p-1.5">
      <ToolbarButton active={editor.isActive('bold')} disabled={sourceMode} title="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('italic')} disabled={sourceMode} title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('heading', {level: 1})}
        disabled={sourceMode}
        title="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('heading', {level: 2})}
        disabled={sourceMode}
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({level: 2}).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('bulletList')}
        disabled={sourceMode}
        title="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('orderedList')}
        disabled={sourceMode}
        title="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('blockquote')}
        disabled={sourceMode}
        title="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('codeBlock') && editor.getAttributes('codeBlock').language !== 'mermaid'}
        disabled={sourceMode}
        title="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.getAttributes('codeBlock').language === 'mermaid'}
        disabled={sourceMode}
        title="Mermaid diagram"
        onClick={() => editor.chain().focus().toggleCodeBlock({language: 'mermaid'}).run()}
      >
        <Code2 className="h-4 w-4" />
      </ToolbarButton>

      {!sourceMode && <LinkButton editor={editor} />}
      {!sourceMode && <ImageInsertButton editor={editor} imagePicker={imagePicker} />}
      {!sourceMode && <TableButton editor={editor} />}

      <div className="ml-auto flex items-center gap-1">
        <ExportPdfButton editor={editor} disabled={sourceMode} exportTitle={exportTitle} />
        <ToolbarButton active={sourceMode} title="View source" onClick={onToggleSourceMode}>
          <FileCode className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;
