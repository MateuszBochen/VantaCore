import {useState} from 'react';
import {NodeViewContent, NodeViewWrapper} from '@tiptap/react';
import type {ReactNodeViewProps} from '@tiptap/react';
import {Code} from 'lucide-react';
import MermaidBlock from '../MermaidBlock';

// The React node view behind MermaidCodeBlock (kept in its own file so that
// extension module can stay a non-component export without tripping
// react-refresh). A fenced code block with language `mermaid` renders the
// live diagram, with its source hidden by default:
// - read-only (MarkdownPreview) - diagram only, never the source;
// - editable (MarkdownEditor) - a "Code" toggle shows/hides the source. A
//   block that's empty when it appears (just typed ```mermaid) starts with
//   its source open, so typing into it doesn't hide it after the first key.
// Either way the source is shown when the diagram fails to render (invalid
// syntax), otherwise there'd be nothing on screen at all. The <pre> is
// hidden with CSS rather than unmounted - it holds ProseMirror's contentDOM,
// which must stay in the document. Any other language keeps the default
// plain <pre><code> rendering.
const MermaidCodeBlockView = ({node, editor}: ReactNodeViewProps) => {
  const isMermaid = node.attrs.language === 'mermaid';
  const [sourceOpen, setSourceOpen] = useState(() => node.textContent.trim() === '');
  const [renderFailed, setRenderFailed] = useState(false);
  const editable = editor.isEditable;

  const showSource = !isMermaid || renderFailed || (editable && sourceOpen);

  return (
    <NodeViewWrapper className={isMermaid ? 'relative flex flex-col gap-2' : undefined}>
      <pre className={showSource ? undefined : 'hidden'}>
        <NodeViewContent<'code'> as="code" />
      </pre>

      {isMermaid && (
        <div contentEditable={false} className="relative">
          <MermaidBlock code={node.textContent} onRenderResult={(ok) => setRenderFailed(!ok)} />

          {editable && (
            <button
              type="button"
              onClick={() => setSourceOpen((current) => !current)}
              title={sourceOpen ? 'Hide diagram code' : 'Edit diagram code'}
              className="absolute right-2 top-2 flex cursor-pointer items-center gap-1 rounded-md border border-border bg-popover/80 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Code className="h-3.5 w-3.5" />
              {sourceOpen ? 'Hide code' : 'Code'}
            </button>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default MermaidCodeBlockView;
