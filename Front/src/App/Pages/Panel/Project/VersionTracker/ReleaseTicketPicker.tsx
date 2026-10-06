import {useEffect, useState} from 'react';
import {Check, Plus, X} from 'lucide-react';
import {Input} from '@/components/ui/input';
import useAdvancedSearchHook from '@/lib/Search/useAdvancedSearchHook';
import {DEFAULT_ADVANCED_SEARCH_FILTERS} from '@/lib/Search/defaultAdvancedSearchFilters';

// Server-side search (GET /api/search, fullMode), not a client-side filter
// over the whole project's tickets - a project can have thousands, this is
// a small inline control, not a page of its own. Shared between ReleaseCard
// (Version Tracker) and RoadmapReleasePanel (Roadmap) - both attach tickets
// to the same Release resource the same way (PUT's ticketIds).
const SEARCH_RESULTS_LIMIT = 8;
const SEARCH_DEBOUNCE_MS = 300;

type TicketDetails = {key: string; title: string};

type ReleaseTicketPickerProps = {
  projectId: string;
  ticketIds: string[];
  onTicketIdsChange: (ticketIds: string[]) => void;
  // Labels for tickets already on the release, so they show real key/title
  // immediately instead of a bare id, before any search ever runs.
  initialTicketDetails: {id: string; key: string; title: string}[];
};

const ReleaseTicketPicker = ({projectId, ticketIds, onTicketIdsChange, initialTicketDetails}: ReleaseTicketPickerProps) => {
  const {searchTicketsFull} = useAdvancedSearchHook();

  // Accumulates as tickets are seen (seeded from initialTicketDetails,
  // topped up with every search hit) rather than being derived fresh from
  // the current search results - a ticket picked from an earlier query
  // still needs its label once the query changes to something else.
  const [ticketDetails, setTicketDetails] = useState<Map<string, TicketDetails>>(
    () => new Map(initialTicketDetails.map((ticket) => [ticket.id, {key: ticket.key, title: ticket.title}])),
  );
  const [query, setQuery] = useState('');
  const [searchResultIds, setSearchResultIds] = useState<string[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    // An empty query renders no results box at all (see below), so there's
    // nothing to search or reset here - leaving stale searchResultIds/
    // searching state in place is harmless since neither is ever shown
    // while the query is empty.
    if (trimmed === '') {
      return;
    }

    let cancelled = false;

    // Debounced - a real request per keystroke against a search endpoint
    // (rather than a client-side filter) has an actual server cost, and
    // only the last keystroke's query is worth answering anyway. setSearching
    // fires inside this timeout (not synchronously in the effect body) so
    // it doesn't trigger react-hooks/set-state-in-effect.
    const timeoutId = setTimeout(() => {
      setSearching(true);

      searchTicketsFull({...DEFAULT_ADVANCED_SEARCH_FILTERS, q: trimmed, types: ['ticket'], projectIds: [projectId]}, 0, SEARCH_RESULTS_LIMIT).then((result) => {
        if (cancelled) {
          return;
        }

        setSearching(false);

        if (result.success) {
          setSearchResultIds(result.tickets.map((ticket) => ticket.id));
          setTicketDetails((current) => {
            const next = new Map(current);
            result.tickets.forEach((ticket) => next.set(ticket.id, {key: ticket.key, title: ticket.title}));
            return next;
          });
        }
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchTicketsFull is a thin useRequestHook wrapper recreated every render; projectId is fixed for this picker instance's lifetime
  }, [query]);

  const toggleTicket = (id: string) => {
    onTicketIdsChange(ticketIds.includes(id) ? ticketIds.filter((ticketId) => ticketId !== id) : [...ticketIds, id]);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {ticketIds.length > 0 && (
        <div className="flex flex-col gap-1">
          {ticketIds.map((id) => {
            const details = ticketDetails.get(id);

            return (
              <div key={id} className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                <span className="min-w-0 flex-1 truncate">
                  <span className="text-muted-foreground">{details?.key ?? id}</span> {details?.title ?? ''}
                </span>
                <button type="button" onClick={() => toggleTicket(id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this project's tickets…" />

      {query.trim() !== '' && (
        <div className="flex flex-col gap-1 rounded-md border border-border/60 p-1">
          {searching ? (
            <p className="px-1.5 py-1 text-xs text-muted-foreground">Searching…</p>
          ) : searchResultIds !== null && searchResultIds.length === 0 ? (
            <p className="px-1.5 py-1 text-xs text-muted-foreground">No matching tickets.</p>
          ) : (
            (searchResultIds ?? []).map((id) => {
              const details = ticketDetails.get(id);
              const selected = ticketIds.includes(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleTicket(id)}
                  className="flex items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs hover:bg-muted"
                >
                  {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-accent" /> : <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-muted-foreground">{details?.key ?? id}</span> {details?.title ?? ''}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ReleaseTicketPicker;
