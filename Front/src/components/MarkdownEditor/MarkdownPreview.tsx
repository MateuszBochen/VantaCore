import {useEffect} from 'react';
import {EditorContent, useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {Markdown} from 'tiptap-markdown';
import {cn} from '@/lib/utils';
import {MermaidCodeBlock} from './tiptap/MermaidCodeBlock';
import {AttachmentImage} from './tiptap/AttachmentImage';
import {AttachmentVideo} from './tiptap/AttachmentVideo';
import {handleAttachmentDoubleClick} from './tiptap/handleAttachmentDoubleClick';
import {UserMention} from './tiptap/UserMentionExtension';
import {TicketLink} from './tiptap/TicketLinkExtension';
import './tiptap/prosemirror.css';

type MarkdownPreviewProps = {
  source: string;
  className?: string;
};

// Same extension set as MarkdownEditor (mentions/ticket-links/mermaid must
// render identically in both), just `editable: false` and no toolbar - for
// content that's already been written elsewhere (e.g. a posted comment) and
// only needs to render, not be edited.
const extensions = [
  StarterKit.configure({codeBlock: false, link: {openOnClick: true}}),
  MermaidCodeBlock,
  AttachmentImage,
  AttachmentVideo,
  Markdown.configure({html: false, tightLists: true, linkify: false}),
  UserMention,
  TicketLink,
];

const MarkdownPreview = ({source, className}: MarkdownPreviewProps) => {
  const editor = useEditor({
    extensions,
    content: source,
    editable: false,
    editorProps: {
      attributes: {
        class: 'tiptap-content focus:outline-none',
      },
      handleDoubleClickOn: handleAttachmentDoubleClick,
    },
  });

  // Same reasoning as MarkdownEditor's sync effect - this component doesn't
  // necessarily remount just because `source` changed (e.g. a list re-using
  // the same component instance across rows).
  useEffect(() => {
    if (editor && editor.storage.markdown.getMarkdown() !== source) {
      editor.commands.setContent(source);
    }
  }, [editor, source]);

  return (
    <div className={cn('min-w-0', className)}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default MarkdownPreview;
