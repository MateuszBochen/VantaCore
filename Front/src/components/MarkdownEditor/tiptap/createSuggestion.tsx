import {ReactRenderer} from '@tiptap/react';
import type {SuggestionOptions, SuggestionProps} from '@tiptap/suggestion';
import SuggestionList, {type SuggestionItem, type SuggestionListHandle} from './SuggestionList';

type CreateSuggestionOptions<T> = {
  char: string;
  items: (query: string) => T[] | Promise<T[]>;
  toSuggestionItem: (item: T) => SuggestionItem;
  emptyLabel: string;
};

// Shared wiring for @mention and ~ticket-link's dropdown: Tiptap v3's
// Suggestion utility hands the render lifecycle a `mount()` helper that
// positions a floating element against the cursor itself (Floating UI under
// the hood) - no manual tippy.js/positioning code needed, just render
// SuggestionList into a ReactRenderer and hand its element to `mount()`.
export const createSuggestion = <T,>({
  char,
  items,
  toSuggestionItem,
  emptyLabel,
}: CreateSuggestionOptions<T>): Partial<SuggestionOptions<SuggestionItem>> => ({
  char,
  items: async ({query}) => (await items(query)).map(toSuggestionItem),
  render: () => {
    let component: ReactRenderer<SuggestionListHandle> | null = null;
    let unmount: (() => void) | null = null;

    return {
      onStart: (props: SuggestionProps<SuggestionItem>) => {
        component = new ReactRenderer(SuggestionList, {
          props: {items: props.items, command: props.command, emptyLabel},
          editor: props.editor,
        });
        unmount = props.mount(component.element);
      },
      onUpdate: (props: SuggestionProps<SuggestionItem>) => {
        component?.updateProps({items: props.items, command: props.command, emptyLabel});
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          unmount?.();
          return true;
        }

        return component?.ref?.onKeyDown(props) ?? false;
      },
      onExit: () => {
        unmount?.();
        component?.destroy();
      },
    };
  },
});
