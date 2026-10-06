import {Node, mergeAttributes} from '@tiptap/core';
import type * as MarkdownIt from 'markdown-it';
import type {MarkdownNodeSpec} from 'tiptap-markdown';
import {getAttachmentBlobByPath} from '@/lib/Attachment/getAttachmentBlob';
import {ATTACHMENT_SRC_PATTERN} from './attachmentSrcPattern';
import {openAttachmentLightbox} from './openAttachmentLightbox';
import markdownVideoSizeRule from './markdownVideoSizeRule';

const MIN_VIDEO_WIDTH = 120;

type AttachmentVideoAttrs = {
  src: string;
  title: string | null;
  width: string | number | null;
  height: string | number | null;
};

// Same declaration-merging pattern @tiptap/extension-image itself uses for
// setImage - without this, editor.chain().insertVideo(...) (see
// Toolbar.tsx's VideoInsertButton) has no type to chain against.
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    attachmentVideo: {
      insertVideo: (attrs: {src: string; title?: string}) => ReturnType;
    };
  }
}

// Same vanilla-DOM NodeView approach as AttachmentImage.tsx, same reasoning
// (a React NodeView here previously desynced ProseMirror's DOM-to-position
// mapping badly enough to lose the cursor and drop the node on typing).
// Unlike Image, there's no @tiptap/extension-video to extend - Node.create
// builds the schema from scratch, mirroring exactly the attrs/parseHTML/
// renderHTML shape @tiptap/extension-image itself uses internally.
//
// Markdown round-trip: there's no standard markdown video syntax, so this
// serializes to a bespoke `!video[title](src =WxH)` form (see
// markdownVideoSizeRule.ts for the parse+render side - and why it can't
// just piggyback on markdown-it's own `image` token renderer the way
// AttachmentImage does).
export const AttachmentVideo = Node.create({
  name: 'attachment_video',
  group: 'block',
  atom: true,
  draggable: false,

  addAttributes() {
    return {
      src: {default: null},
      title: {default: null},
      width: {default: null},
      height: {default: null},
    };
  },

  parseHTML() {
    return [{tag: 'video[src]'}];
  },

  renderHTML({HTMLAttributes}) {
    return ['video', mergeAttributes(HTMLAttributes, {controls: 'true'})];
  },

  addCommands() {
    return {
      insertVideo:
        (attrs: {src: string; title?: string}) =>
        ({commands}) =>
          commands.insertContent({type: this.name, attrs}),
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          const {src, title, width, height} = node.attrs as AttachmentVideoAttrs;

          let out = `!video[${state.esc(title || '')}](${src.replace(/[()]/g, '\\$&')}`;

          if (width || height) {
            out += ` =${width || ''}x${height || ''}`;
          }

          state.write(`${out})`);
        },
        parse: {
          setup(markdownit: MarkdownIt) {
            // Same idempotency guard as markdownImageSizeRule's own setup -
            // MarkdownParser re-runs every extension's setup() on every
            // parse(), not just once.
            const md = markdownit as MarkdownIt & {__attachmentVideoSizeRuleInstalled?: boolean};

            if (!md.__attachmentVideoSizeRuleInstalled) {
              markdownVideoSizeRule(md);
              md.__attachmentVideoSizeRuleInstalled = true;
            }
          },
        },
      } satisfies MarkdownNodeSpec,
    };
  },

  addNodeView() {
    return ({node, editor, view, getPos}) => {
      let currentNode = node;

      const wrapper = document.createElement('div');
      wrapper.className = 'attachment-video-wrapper';

      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;

      if (currentNode.attrs.title) {
        video.title = currentNode.attrs.title;
      }

      const applySize = () => {
        const {width, height} = currentNode.attrs as AttachmentVideoAttrs;
        video.style.width = width ? `${width}px` : '';
        video.style.height = height ? `${height}px` : '';
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
          video.src = src;
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
          video.src = objectUrl;
        });
      };

      resolveSrc(currentNode.attrs.src);
      wrapper.appendChild(video);

      // Double-click opens the video at full size (autoplaying) in a
      // lightbox - same as AttachmentImage, works in both editable and
      // read-only rendering. preventDefault too (on top of the shared
      // stopPropagation-from-ProseMirror trick) since a dblclick on native
      // video controls can otherwise also trigger the browser's own
      // fullscreen/native picture-in-picture behavior.
      video.addEventListener('dblclick', (event) => {
        event.preventDefault();
        event.stopPropagation();

        openAttachmentLightbox(() => {
          const fullVideo = document.createElement('video');
          fullVideo.src = video.currentSrc || video.src;
          fullVideo.controls = true;
          fullVideo.autoplay = true;
          return fullVideo;
        });
      });

      // Only in editable mode (not MarkdownPreview's read-only rendering,
      // which shares this exact same node view) - same reasoning as
      // AttachmentImage's resize handle.
      if (editor.isEditable) {
        const handle = document.createElement('div');
        handle.className = 'attachment-image-resize-handle';
        handle.addEventListener('pointerdown', (event) => {
          event.preventDefault();
          event.stopPropagation();

          const startX = event.clientX;
          const startWidth = video.getBoundingClientRect().width;
          const aspectRatio = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : null;

          const handlePointerMove = (moveEvent: PointerEvent) => {
            const newWidth = Math.max(MIN_VIDEO_WIDTH, Math.round(startWidth + (moveEvent.clientX - startX)));
            video.style.width = `${newWidth}px`;
            video.style.height = aspectRatio ? `${Math.round(newWidth / aspectRatio)}px` : '';
          };

          const handlePointerUp = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);

            const pos = getPos();

            if (typeof pos !== 'number') {
              return;
            }

            const rect = video.getBoundingClientRect();

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

          if (updatedNode.attrs.title) {
            video.title = updatedNode.attrs.title;
          }

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
