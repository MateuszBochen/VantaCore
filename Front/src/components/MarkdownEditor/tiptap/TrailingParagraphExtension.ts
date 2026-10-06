import {Extension} from '@tiptap/core';
import {Plugin, PluginKey} from '@tiptap/pm/state';

// Keeps the document always ending in an (empty, if nothing else) paragraph
// - without this, a table (or any other non-paragraph block: a mermaid code
// block, an image) landing at the very end of the document leaves no text
// position to click/arrow into past it. For a table specifically, that
// meant the Toolbar's table button read as permanently `disabled` (it's
// gated on NOT already being inside a table, see Toolbar.tsx) with no way
// to ever leave the one already there. Runs on every transaction, not just
// on table insert, so it also covers a table arriving via "view source"
// paste at the document's end, not just the toolbar's own insert path.
export const TrailingParagraph = Extension.create({
  name: 'trailingParagraph',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('trailingParagraph'),
        appendTransaction: (_transactions, _oldState, newState) => {
          const paragraphType = newState.schema.nodes.paragraph;
          const lastNode = newState.doc.lastChild;

          if (!paragraphType || !lastNode || lastNode.type === paragraphType) {
            return null;
          }

          return newState.tr.insert(newState.doc.content.size, paragraphType.create());
        },
      }),
    ];
  },
});
