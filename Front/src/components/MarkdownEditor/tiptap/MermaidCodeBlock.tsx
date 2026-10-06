import CodeBlock from '@tiptap/extension-code-block';
import {ReactNodeViewRenderer} from '@tiptap/react';
import MermaidCodeBlockView from './MermaidCodeBlockView';

// Extends the same `codeBlock` node StarterKit already registers (StarterKit
// must have its own codeBlock disabled - see MarkdownEditor.tsx - two
// extensions can't claim the same node name) so a fenced code block with
// language `mermaid` renders the live diagram below its still-editable
// source. The node view itself lives in MermaidCodeBlockView.tsx.
export const MermaidCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MermaidCodeBlockView);
  },
});
