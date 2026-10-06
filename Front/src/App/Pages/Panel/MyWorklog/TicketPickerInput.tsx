import {useRef, useState} from 'react';
import {Search, X} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {AnchoredDropdown} from '@/components/ui/anchored-dropdown';
import {useDebouncedCallback} from '@/lib/hooks/useDebouncedCallback';
import useAdvancedSearchHook from '@/lib/Search/useAdvancedSearchHook';
import {DEFAULT_ADVANCED_SEARCH_FILTERS} from '@/lib/Search/defaultAdvancedSearchFilters';
import type {SearchResultTicket} from '@/lib/Search/Type/types';

export type PickedTicket = {id: string; key: string; title: string; projectId: string};

type TicketPickerInputProps = {
  value: PickedTicket | null;
  onChange: (ticket: PickedTicket | null) => void;
  // Editing an existing worklog entry - its ticket can't be reassigned (the
  // update endpoint is scoped by project/ticket/worklog id in the URL, not
  // something the request body can change), so the picked chip is shown
  // read-only (no clear button) instead of falling back to the search input.
  disabled?: boolean;
};

const MIN_QUERY_LENGTH = 2;

// Search-as-you-type picker over every ticket in every project (the
// project-scoped ticket search fields elsewhere - TicketLinkList,
// SprintTicketPicker - don't fit here since "log time on any ticket" isn't
// scoped to one project or one board). Uses the lightweight (non-fullMode)
// /api/search hit shape - SearchResultTicket already carries key/title/
// projectId, which is all logWorklog needs, so there's no reason to pay for
// fullMode's full GetTicketResult payload just to populate a picker dropdown.
const TicketPickerInput = ({value, onChange, disabled}: TicketPickerInputProps) => {
  const {search} = useAdvancedSearchHook();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultTicket[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  const runSearch = useDebouncedCallback((q: string) => {
    if (q.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    const currentRequestId = ++requestId.current;
    setLoading(true);

    search({...DEFAULT_ADVANCED_SEARCH_FILTERS, q, types: ['ticket']}).then((result) => {
      if (currentRequestId !== requestId.current) {
        return;
      }

      setLoading(false);

      if (result.success) {
        setResults(result.tickets);
      }
    });
  }, 300);

  const handleQueryChange = (next: string) => {
    setQuery(next);
    setOpen(true);
    runSearch(next);
  };

  const handlePick = (ticket: SearchResultTicket) => {
    onChange({id: ticket.id, key: ticket.key, title: ticket.title, projectId: ticket.projectId});
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-(--input-border) bg-(--input-background) px-2.5 py-1.5 text-sm">
        <span className="min-w-0 flex-1 truncate">
          <span className="text-muted-foreground">{value.key}</span> {value.title}
        </span>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disableRipple
            onClick={() => onChange(null)}
            className="h-5 w-5 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div ref={inputWrapperRef} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search a ticket by key or title…"
          className="pl-8"
        />
      </div>

      <AnchoredDropdown open={open && query.trim().length >= MIN_QUERY_LENGTH} anchor={inputWrapperRef} className="max-h-56 min-w-64">
        {loading ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">Searching…</p>
        ) : results.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">No tickets found.</p>
        ) : (
          results.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              // onMouseDown, not onClick - fires before the input's onBlur
              // closes the dropdown, so the click still lands on this row.
              onMouseDown={() => handlePick(ticket)}
              className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left outline-none hover:bg-muted"
            >
              <span className="min-w-0 truncate">
                <span className="text-muted-foreground">{ticket.key}</span> {ticket.title}
              </span>
            </button>
          ))
        )}
      </AnchoredDropdown>
    </div>
  );
};

export default TicketPickerInput;
