import {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

export type SuggestionListHandle = {
  onKeyDown: (props: {event: KeyboardEvent}) => boolean;
};

export type SuggestionItem = {
  id: string;
  label: string;
  render: ReactNode;
};

type SuggestionListProps = {
  items: SuggestionItem[];
  command: (item: {id: string; label: string}) => void;
  emptyLabel: string;
};

// Shared dropdown UI for both @mention (users) and ~ticket-link (tickets) -
// only the item content differs (avatar+name vs key+title), the
// keyboard-nav/selection/positioning plumbing is identical, wired up by
// createSuggestion.tsx's ReactRenderer + tippy popup.
const SuggestionList = forwardRef<SuggestionListHandle, SuggestionListProps>(({items, command, emptyLabel}, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = (index: number) => {
    const item = items[index];

    if (item) {
      command({id: item.id, label: item.label});
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({event}) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((current) => (current + items.length - 1) % items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((current) => (current + 1) % items.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  if (items.length === 0) {
    return <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm text-muted-foreground">{emptyLabel}</div>;
  }

  return (
    <div className="flex max-h-64 min-w-48 flex-col gap-0.5 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-xl">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => selectItem(index)}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
            index === selectedIndex ? 'bg-accent/20 text-accent' : 'text-foreground hover:bg-muted',
          )}
        >
          {item.render}
        </button>
      ))}
    </div>
  );
});

SuggestionList.displayName = 'SuggestionList';

export default SuggestionList;
