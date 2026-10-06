import Image from '@tiptap/extension-image';
import type * as MarkdownIt from 'markdown-it';
import type {MarkdownNodeSpec} from 'tiptap-markdown';
import {getAttachmentBlobByPath} from '@/lib/Attachment/getAttachmentBlob';
import markdownImageSizeRule from './markdownImageSizeRule';
import {ATTACHMENT_SRC_PATTERN} from './attachmentSrcPattern';

const MIN_IMAGE_WIDTH = 40;

type AttachmentImageAttrs = {
  src: string;
  alt: string | null;
  title: string | null;
  width: string | number | null;
  height: string | number | null;
};

// A plain ProseMirror NodeView (the same shape @tiptap/extension-image's own
// `resize` option uses internally - see node_modules for reference), NOT a
// ReactNodeViewRenderer one. An earlier React-based version desynced
// ProseMirror's DOM-to-position mapping around the node badly enough that
// the cursor vanished and typing dropped the node entirely. A vanilla
// NodeView - just DOM elements this code owns directly - is exactly the
// shape ProseMirror already expects, so there's nothing left to desync.
//
// Every attachment image (whatever it's attached to) needs the same
// authenticated blob fetch as AttachmentsSection's thumbnails (see
// getAttachmentBlobByPath) - a plain <img src> pointing at that path would
// just 401. Anything else (an external URL pasted via the toolbar's "or
// paste a URL" fallback) is set as `src` directly, unchanged.
//
// Resize: a corner drag handle (shown on hover, editable mode only) updates
// the node's width/height attrs, which addStorage below serializes into the
// markdown text as a `=WxH` suffix (parsed back on the way in via
// markdownImageSizeRule) - so a resize survives a save/reload, not just the
// current editing session.
export const AttachmentImage = Image.extend({
  // Base `Image` is `draggable: true`. ProseMirror acts on that on every
  // mousedown over the node - it flips `draggable` back on the <img> (see
  // prosemirror-view's LeftMouseDown.mightDrag) so the node can be dragged
  // to a new position. The side effect: a native image drag starting
  // between the two mousedowns of a double-click cancels the `dblclick`
  // entirely, so the full-size lightbox below never fires. AttachmentVideo
  // already sets this for the same reason; drag-to-reposition an image
  // inside the editor is a marginal loss next to double-click-to-zoom
  // actually working.
  draggable: false,

  addStorage() {
    return {
      markdown: {
        // Same shape as prosemirror-markdown's own default image serializer
        // (plain tiptap-markdown delegates straight to it - see its own
        // image.js) - extended with the same `=WxH` suffix markdownImageSizeRule
        // below parses back out.
        serialize(state, node) {
          const {src, alt, title, width, height} = node.attrs as AttachmentImageAttrs;

          let out = `![${state.esc(alt || '')}](${src.replace(/[()]/g, '\\$&')}`;

          if (title) {
            out += ` "${title.replace(/"/g, '\\"')}"`;
          }

          if (width || height) {
            out += ` =${width || ''}x${height || ''}`;
          }

          state.write(`${out})`);
        },
        parse: {
          setup(markdownit: MarkdownIt) {
            // markdownImageSizeRule's .before() call unconditionally
            // inserts a new rule every time, and MarkdownParser re-runs
            // every extension's setup() on every parse() - not just once -
            // so without this guard, a long editing session (each
            // setContent call, e.g. switching tickets) would pile up
            // duplicate 'image' rules on this same markdown-it instance.
            const md = markdownit as MarkdownIt & {__attachmentImageSizeRuleInstalled?: boolean};

            if (!md.__attachmentImageSizeRuleInstalled) {
              markdownImageSizeRule(md);
              md.__attachmentImageSizeRuleInstalled = true;
            }
          },
        },
      } satisfies MarkdownNodeSpec,
    };
  },

  addNodeView() {
    return ({node, editor, view, getPos}) => {
      let currentNode = node;

      // A div, not a span - this node's schema group is 'block' (see
      // MarkdownEditor.tsx, Image isn't configured with options.inline
      // anywhere), and the DOM element a NodeView returns should match.
      const wrapper = document.createElement('div');
      wrapper.className = 'attachment-image-wrapper';

      const img = document.createElement('img');
      img.alt = currentNode.attrs.alt ?? '';
      // The Image node's schema is `draggable: true`, and a native <img> is
      // draggable by default on top of that - either one starting a drag
      // between the two mousedowns of a double-click swallows the dblclick,
      // so the full-size lightbox below never opens. @tiptap/extension-image's
      // own resize node view sets exactly this for the same reason; this
      // custom node view replaces that one wholesale, so it has to repeat it.
      img.draggable = false;

      if (currentNode.attrs.title) {
        img.title = currentNode.attrs.title;
      }

      const applySize = () => {
        const {width, height} = currentNode.attrs as AttachmentImageAttrs;
        img.style.width = width ? `${width}px` : '';
        img.style.height = height ? `${height}px` : '';
      };

      applySize();

      let cancelled = false;
      let objectUrl: string | null = null;
      let resolvedForSrc: string | null = null;

      const resolveSrc = (src: string | null) => {
        if (!src || src === resolvedForSrc) {
          return;
        }

        resolvedForSrc = src;

        if (!ATTACHMENT_SRC_PATTERN.test(src)) {
          img.src = src;
          return;
        }

        getAttachmentBlobByPath(src).then((result) => {
          if (cancelled || !result.success) {
            return;
          }

          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }

          objectUrl = URL.createObjectURL(result.blob);
          img.src = objectUrl;
        });
      };

      resolveSrc(currentNode.attrs.src);
      wrapper.appendChild(img);

      // Double-click to open the full-size lightbox is handled at the editor
      // level now (editorProps.handleDoubleClickOn, see
      // handleAttachmentDoubleClick) - a plain `dblclick` listener here got
      // swallowed whenever a native image drag started between the two
      // clicks. Both MarkdownEditor and MarkdownPreview wire that handler,
      // so this shared node view needs nothing of its own.

      // Only in editable mode (not MarkdownPreview's read-only rendering,
      // which shares this exact same node view) - a viewer of a posted
      // comment shouldn't be able to drag-resize (and silently dispatch a
      // transaction into) content that isn't theirs to edit.
      if (editor.isEditable) {
        const handle = document.createElement('div');
        handle.className = 'attachment-image-resize-handle';
        handle.addEventListener('pointerdown', (event) => {
          event.preventDefault();
          event.stopPropagation();

          const startX = event.clientX;
          const startWidth = img.getBoundingClientRect().width;
          const aspectRatio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : null;

          const handlePointerMove = (moveEvent: PointerEvent) => {
            const newWidth = Math.max(MIN_IMAGE_WIDTH, Math.round(startWidth + (moveEvent.clientX - startX)));
            img.style.width = `${newWidth}px`;
            img.style.height = aspectRatio ? `${Math.round(newWidth / aspectRatio)}px` : '';
          };

          const handlePointerUp = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);

            const pos = getPos();

            if (typeof pos !== 'number') {
              return;
            }

            const rect = img.getBoundingClientRect();

            view.dispatch(
              view.state.tr.setNodeMarkup(pos, undefined, {
                ...currentNode.attrs,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              }),
            );
          };

          window.addEventListener('pointermove', handlePointerMove);
          window.addEventListener('pointerup', handlePointerUp);
        });

        wrapper.appendChild(handle);
      }

      return {
        dom: wrapper,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) {
            return false;
          }

          currentNode = updatedNode;
          img.alt = updatedNode.attrs.alt ?? '';
          applySize();
          resolveSrc(updatedNode.attrs.src);
          return true;
        },
        destroy: () => {
          cancelled = true;

          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
        },
      };
    };
  },
});
