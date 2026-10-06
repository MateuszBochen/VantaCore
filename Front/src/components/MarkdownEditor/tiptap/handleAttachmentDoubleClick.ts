import type {Node as ProseMirrorNode} from '@tiptap/pm/model';
import type {EditorView} from '@tiptap/pm/view';
import {openImageLightbox} from './openImageLightbox';

// ProseMirror-level `handleDoubleClickOn` for the attachment image node -
// wired into both MarkdownEditor and MarkdownPreview's editorProps.
//
// prosemirror-view runs this from its own mousedown handling on the second
// click of a double-click (before any drag gesture can begin), so unlike a
// plain `dblclick` DOM listener on the <img> it can't be swallowed by an
// in-progress native image drag - which is what stopped the old node-view
// listener from ever opening the lightbox. AttachmentVideo keeps its own
// listener (a <video> isn't drag-prone the same way, and its blob src isn't
// on the event target when the controls are clicked).
export const handleAttachmentDoubleClick = (
  view: EditorView,
  _pos: number,
  node: ProseMirrorNode,
  nodePos: number,
  event: MouseEvent,
): boolean => {
  if (node.type.name !== 'image') {
    return false;
  }

  // node.attrs.src is the raw `/api/.../download` path - a bare <img> on it
  // 401s (no auth header), which is why AttachmentImage's node view fetches
  // an authenticated blob and points the on-screen <img> at an object URL.
  // Reuse that already-resolved URL: prefer the clicked element, fall back
  // to the node view's own <img> via view.nodeDOM.
  const fromTarget = event.target instanceof HTMLImageElement ? event.target : null;
  const nodeDom = view.nodeDOM(nodePos);
  const fromNodeView =
    nodeDom instanceof HTMLElement ? (nodeDom instanceof HTMLImageElement ? nodeDom : nodeDom.querySelector('img')) : null;
  const resolvedImg = fromTarget ?? fromNodeView;

  const src = resolvedImg?.currentSrc || resolvedImg?.src || (node.attrs.src as string | null);

  if (!src) {
    return false;
  }

  openImageLightbox(src, (node.attrs.alt as string | null) ?? '');

  return true;
};
