import {memo, useEffect, useMemo, useState} from 'react';
import {EditorContent, useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {Table} from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import {Markdown} from 'tiptap-markdown';
import {Textarea} from '@/components/ui/textarea';
import {cn} from '@/lib/utils';
import {MermaidCodeBlock} from './tiptap/MermaidCodeBlock';
import {AttachmentImage} from './tiptap/AttachmentImage';
import {AttachmentVideo} from './tiptap/AttachmentVideo';
import {handleAttachmentDoubleClick} from './tiptap/handleAttachmentDoubleClick';
import {UserMention} from './tiptap/UserMentionExtension';
import {TicketLink} from './tiptap/TicketLinkExtension';
import {TrailingParagraph} from './tiptap/TrailingParagraphExtension';
import Toolbar from './tiptap/Toolbar';
import './tiptap/prosemirror.css';
import type {MarkdownEditorProps} from './types';

// codeBlock is disabled here in favor of MermaidCodeBlock (same node name,
// extended with a NodeView that renders a live diagram when
// language === 'mermaid') - Tiptap doesn't allow two extensions to register
// the same node name, so StarterKit's own copy has to make way for it.
const createExtensions = (placeholder?: string) => [
  StarterKit.configure({codeBlock: false, link: {openOnClick: false}}),
  MermaidCodeBlock,
  AttachmentImage,
  AttachmentVideo,
  Placeholder.configure({placeholder: placeholder ?? ''}),
  // Not part of StarterKit - without these, tiptap-markdown's own bundled
  // table serializer/parser (name-matched against the schema, see
  // node_modules/tiptap-markdown/src/util/extensions.js) never activates:
  // markdown-it already parses GFM `| --- |` syntax into <table> HTML just
  // fine, but with no table/tableRow/tableCell/tableHeader node in the
  // schema, ProseMirror's DOM parser has no rule for those tags and falls
  // through into their text content - every cell's text ends up
  // concatenated with no structure instead of an actual table.
  Table.configure({resizable: true}),
  TableRow,
  TableHeader,
  TableCell,
  // Guards the one thing the fix above doesn't: a table (or any other
  // non-paragraph block) landing at the very end of the document leaves no
  // text position after it to click/arrow into - see its own comment.
  TrailingParagraph,
  Markdown.configure({html: false, tightLists: true, linkify: false}),
  UserMention,
  TicketLink,
];

// WYSIWYG rewrite (2026-08-05) of what used to wrap @uiw/react-md-editor -
// same MarkdownEditorProps contract (value/onChange/placeholder/className),
// so every call site is unaffected. Built on Tiptap + tiptap-markdown for
// markdown-text-in/markdown-text-out, with @mention and ~ticket-link
// dropdowns (see tiptap/UserMentionExtension.tsx, tiptap/TicketLinkExtension.tsx)
// and a toolbar covering formatting that used to require knowing raw
// markdown syntax. "View source" (Toolbar's rightmost button) is the escape
// hatch back to a plain markdown textarea for anyone who still wants that.
// Wrapped in memo - it's mounted inside forms (e.g. TicketEditor) that hold
// many OTHER fields in the same state object, so a keystroke in some
// unrelated sibling field would otherwise re-render this whole Tiptap tree
// (extensions, Toolbar, all its buttons) every time too. Only actually skips
// a re-render when the caller also gives it a stable `onChange` (e.g. a
// useCallback built on the functional setState form) - an inline arrow
// function recreated every render defeats this regardless.
const MarkdownEditor = memo(({value, onChange, placeholder, className, imagePicker, exportTitle}: MarkdownEditorProps) => {
  const [sourceMode, setSourceMode] = useState(false);
  const extensions = useMemo(() => createExtensions(placeholder), [placeholder]);

  const editor = useEditor({
    extensions,
    content: value,
    onUpdate: ({editor: updatedEditor}) => {
      onChange(updatedEditor.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-content min-h-full focus:outline-none',
      },
      handleDoubleClickOn: handleAttachmentDoubleClick,
    },
  });

  // Tiptap's `content` option only applies at creation - an external change
  // to `value` (history mode swapping in an older version, a remote update,
  // ...) wouldn't otherwise be reflected, since this component doesn't
  // necessarily remount just because its `value` prop changed (same
  // recurring gotcha as everywhere else in this app that derives state from
  // props - see e.g. TicketPage's draftForId sentinel). Comparing against
  // the editor's own current markdown (rather than unconditionally calling
  // setContent on every prop change) is what stops this from clobbering the
  // user's own in-progress edit the moment onUpdate reports it back up.
  //
  // Skipped entirely while sourceMode is on: the hidden Tiptap editor used
  // to still get re-synced on every keystroke in the source textarea, and
  // setContent (via tiptap-markdown) round-trips the value through
  // markdown-it's parser and serializer to do it. Mid-keystroke text like a
  // single or double backtick isn't yet a valid fenced code block, so it
  // parsed as a plain text node and came back out through the serializer's
  // commonmark escaping (`` ` `` -> `` \` ``) - typing three backticks for a
  // fence ended up as `\`\`\`` one escaped character at a time. The
  // textarea is the sole source of truth while sourceMode is on regardless
  // (only EditorContent, not this effect, needs the doc kept current), so
  // the sync only needs to happen once, right when switching back to the
  // rich view (sourceMode in the deps below makes that happen) -
  // `emitUpdate: false` on that one resync then skips re-notifying the
  // parent through onUpdate, since `value` is already correct by definition
  // at that point (it's what the effect is syncing the editor FROM).
  useEffect(() => {
    if (!editor || sourceMode) {
      return;
    }

    if (editor.storage.markdown.getMarkdown() !== value) {
      editor.commands.setContent(value, {emitUpdate: false});
    }
  }, [editor, value, sourceMode]);

  return (
    <div className={cn('flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-(--input-border) bg-(--input-background)', className)}>
      <Toolbar
        editor={editor}
        sourceMode={sourceMode}
        onToggleSourceMode={() => setSourceMode((current) => !current)}
        imagePicker={imagePicker}
        exportTitle={exportTitle}
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {sourceMode ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-full w-full resize-none border-none bg-transparent p-0 font-mono text-sm shadow-none focus-visible:ring-0"
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    </div>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
