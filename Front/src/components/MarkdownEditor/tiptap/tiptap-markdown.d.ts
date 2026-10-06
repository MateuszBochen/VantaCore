import type {MarkdownStorage} from 'tiptap-markdown';

// tiptap-markdown doesn't ship this augmentation itself, so every
// `editor.storage.markdown` access across the app would otherwise need its
// own cast.
declare module '@tiptap/core' {
  interface Storage {
    markdown: MarkdownStorage;
  }
}

export {};
