import {useCallback, useMemo, useRef, useState} from 'react';
import {X} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {AnchoredDropdown} from '@/components/ui/anchored-dropdown';
import {cn} from '@/lib/utils';

export type ChipInputProps = {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  // Optional autocomplete catalog (e.g. a project's existing tag vocabulary)
  // - filtered by the current draft text and already-picked values, shown as
  // a clickable/keyboard-navigable dropdown below the input. Suggestions
  // only ever narrow what's offered, never what can be typed - committing
  // free text not in this list still works exactly as before, so omitting
  // this prop keeps this component's original free-text-only behavior.
  suggestions?: string[];
};

// A free-text "add on Enter/Space" chip list, optionally backed by an
// autocomplete list. Extracted from TicketFieldsSidebar (Tags field) so
// AdvancedSearchFilters can reuse the exact same input for tag filtering.
export const ChipInput = ({values, onChange, placeholder, suggestions}: ChipInputProps) => {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    if (!suggestions) {
      return [];
    }

    const query = draft.trim().toLowerCase();

    return suggestions.filter(
      (suggestion) => !values.includes(suggestion) && (query === '' || suggestion.toLowerCase().includes(query)),
    );
  }, [suggestions, draft, values]);

  const commit = useCallback(
    (value: string) => {
      const trimmed = value.trim();

      if (trimmed && !values.includes(trimmed)) {
        onChange([...values, trimmed]);
      }

      setDraft('');
      setOpen(false);
      setHighlighted(0);
    },
    [values, onChange],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
          >
            {value}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disableRipple
              onClick={() => onChange(values.filter((v) => v !== value))}
              className="h-4 w-4 min-w-0 rounded-full p-0 text-muted-foreground hover:bg-transparent hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </Button>
          </span>
        ))}
      </div>

      <div ref={inputWrapperRef}>
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setHighlighted(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && matches.length > 0) {
              e.preventDefault();
              setOpen(true);
              setHighlighted((current) => (current + 1) % matches.length);
              return;
            }

            if (e.key === 'ArrowUp' && matches.length > 0) {
              e.preventDefault();
              setOpen(true);
              setHighlighted((current) => (current - 1 + matches.length) % matches.length);
              return;
            }

            if (e.key === 'Escape') {
              setOpen(false);
              return;
            }

            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              commit(open && matches[highlighted] ? matches[highlighted] : draft);
            }
          }}
          onBlur={() => commit(draft)}
          placeholder={placeholder}
        />

        <AnchoredDropdown open={open && matches.length > 0} anchor={inputWrapperRef} className="max-h-48">
          {matches.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              // Fires before the Input's own onBlur (mousedown precedes
              // blur) - without preventDefault, the click would blur the
              // input and commit the raw draft text first, so the click's
              // own onClick would never see this suggestion selected.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(suggestion)}
              className={cn(
                'block w-full cursor-pointer rounded-md px-2 py-1.5 text-left outline-none',
                index === highlighted ? 'bg-muted' : 'hover:bg-muted',
              )}
            >
              {suggestion}
            </button>
          ))}
        </AnchoredDropdown>
      </div>
    </div>
  );
};
