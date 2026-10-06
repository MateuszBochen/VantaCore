import {useEffect, useMemo, useState} from 'react';
import {LoadMoreButton} from '@/components/ui/load-more-button';
import useAdvancedSearchHook from '@/lib/Search/useAdvancedSearchHook';
import {DEFAULT_ADVANCED_SEARCH_FILTERS} from '@/lib/Search/defaultAdvancedSearchFilters';
import AdvancedSearchFilters from '../Search/AdvancedSearchFilters';
import type {Project} from '@/lib/Project/Type/types';
import type {TicketSummary} from '@/lib/Ticket/Type/types';
import toTicketSummary from '@/lib/Ticket/toTicketSummary';
import type {SprintTicketRef} from '@/lib/Sprint/Type/types';
import type {AdvancedSearchFilters as SearchFilters} from '@/lib/Search/Type/types';
import TicketTree from '@/components/TicketTree/TicketTree';
import applyTicketChangedPayload from '@/lib/Ticket/applyTicketChangedPayload';
import {eventBus} from '@/lib/EventBus/EventBus';
import {TicketWasChangedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasChangedRemoteEvent';

const RESULTS_PAGE_LIMIT = 25;

type SprintTicketPickerProps = {
  projectIds: string[];
  // The board's projects, loaded by SprintFormPage (shared with
  // SprintSelectedTickets) - null while still loading.
  projects: Project[] | null;
  tickets: SprintTicketRef[];
  onChange: (tickets: SprintTicketRef[]) => void;
  // Every ticket this picker gets hold of (search hits, expanded children) -
  // SprintSelectedTickets lists/sums the selected ones from that same pool
  // instead of refetching them.
  onTicketsLoaded: (tickets: TicketSummary[]) => void;
  onOpenTicket: (ticket: TicketSummary) => void;
};

// Ticket selection for a Sprint - any ticket from any of the board's linked
// projects, not just roots (see memory: project_vantacore_boards_concept).
// Search (AdvancedSearchFilters/useAdvancedSearchHook, locked to this
// board's own projects + ticket-only results) is the *only* way to find
// tickets - the old always-rendered "browse every root ticket per project"
// tree was removed once the backend added fullMode (real GetTicketResult-
// shaped hits, including childCount) + pagination, per explicit request.
// What's selected (and its estimate summary) is shown by
// SprintSelectedTickets, next to the date calendar.
const SprintTicketPicker = ({projectIds, projects, tickets, onChange, onTicketsLoaded, onOpenTicket}: SprintTicketPickerProps) => {
  const {searchTicketsFull} = useAdvancedSearchHook();
  const projectsLoaded = projects !== null;

  const toggle = (ticket: TicketSummary, checked: boolean, projectId: string) => {
    onChange(
      checked
        ? [...tickets, {ticketId: ticket.id, projectId}]
        : tickets.filter((entry) => entry.ticketId !== ticket.id),
    );
  };

  const [searchFilters, setSearchFilters] = useState<SearchFilters>(() => ({
    ...DEFAULT_ADVANCED_SEARCH_FILTERS,
    types: ['ticket'],
    projectIds,
  }));
  const [results, setResults] = useState<TicketSummary[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  // Bumped on every FRESH search (not "Load more") and folded into each root
  // row's key below - forces React to fully unmount/remount the whole
  // results tree instead of reusing a row whose id happens to also appear in
  // the new result set. Reusing that row would carry over its own local
  // expanded/children state from the PREVIOUS search (a stale set of
  // descendants that don't belong to the current filters), which is exactly
  // what a fresh search should discard - real report: filtering down to 2
  // API results still showed far more rows, because a leftover expanded
  // parent from an earlier, broader search kept its old children mounted.
  const [searchGeneration, setSearchGeneration] = useState(0);

  // Keeps the result rows live when a ticket is edited - e.g. from the
  // TicketPopup, another tab, or another user - instead of showing the
  // snapshot from whenever it was first searched (SprintFormPage does the
  // same for the shared ticket pool).
  useEffect(() => {
    const handleTicketChangedRemotely = (remoteEvent: TicketWasChangedRemoteEvent) => {
      setResults((current) => applyTicketChangedPayload(current, remoteEvent.payload));
    };

    eventBus.subscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);
    };
  }, []);

  const handleSearchFiltersChange = (patch: Partial<SearchFilters>) => setSearchFilters((current) => ({...current, ...patch}));

  // Shared by a fresh search (page 0, replaces results) and "Load more"
  // (page+1, appends) - "Load more" is offered while fewer than the
  // response's total are loaded. `filtersOverride` exists
  // solely for the auto-search-on-mount effect below: it seeds a default
  // status filter and needs to search with THOSE filters immediately (this
  // function's own closure would otherwise still see the pre-default
  // `searchFilters` from the render it was created in) - passing it also
  // syncs it into `searchFilters` state here, so the Status pills reflect
  // the seeded default instead of silently searching by something the UI
  // doesn't show as selected.
  const runSearch = (targetPage: number, append: boolean, filtersOverride?: SearchFilters) => {
    setSearchLoading(true);
    setHasSearched(true);

    if (!append) {
      setSearchGeneration((current) => current + 1);
    }

    if (filtersOverride) {
      setSearchFilters(filtersOverride);
    }

    searchTicketsFull(filtersOverride ?? searchFilters, targetPage, RESULTS_PAGE_LIMIT)
      .then((result) => {
        if (!result.success) {
          setSearchFailed(true);
          return;
        }

        setSearchFailed(false);
        setTotal(result.total);
        setPage(targetPage);

        const mapped = result.tickets.map(toTicketSummary);

        onTicketsLoaded(mapped);

        setResults((current) => (append ? [...current, ...mapped] : mapped));
      })
      .catch(() => setSearchFailed(true))
      .finally(() => setSearchLoading(false));
  };

  const handleSearchSubmit = () => runSearch(0, false);
  const handleLoadMore = () => runSearch(page + 1, true);

  // Fire an initial search as soon as the picker opens, instead of leaving
  // the results panel empty until the user manually clicks Search. Waits for
  // the project fetch to *settle* (projectsLoaded, not just projects.length
  // - projects can legitimately end up empty if every getProject call
  // failed, which must not block this forever) so the single-project default
  // status filter below can be seeded first. Defaults to every status that
  // doesn't mark a ticket done - unplanned/in-progress work is what a sprint
  // is being filled with, done tickets are already-shipped noise - the same
  // single-project gating AdvancedSearchFilters itself uses for its own
  // Status section, since a multi-project board has no single status catalog
  // to default against.
  useEffect(() => {
    if (!projectsLoaded) {
      return;
    }

    const nonDoneStatusIds =
      projects && projects.length === 1 ? projects[0].statuses.filter((status) => !status.isDone).map((status) => status.id) : [];

    const initialFilters: SearchFilters = {...searchFilters, statusIds: nonDoneStatusIds};

    // Deferred a tick: runSearch itself sets state synchronously (loading
    // flags, generation bump) before its own async search call, and the
    // lint rule flags any setState reachable from an effect body even
    // through a same-component function - a microtask boundary is this
    // codebase's way of marking "this is the async kickoff, not a render
    // sync" (see memory: only the *resolution* of an async op may setState
    // inside an effect).
    Promise.resolve().then(() => runSearch(0, false, initialFilters));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run exactly once, the moment the project fetch settles; searchFilters/runSearch are intentionally read fresh but not depended on, this is a one-shot mount action, not a resync
  }, [projectsLoaded]);

  const selectedIds = useMemo(() => new Set(tickets.map((entry) => entry.ticketId)), [tickets]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <AdvancedSearchFilters
          filters={searchFilters}
          onChange={handleSearchFiltersChange}
          onSubmit={handleSearchSubmit}
          loading={searchLoading}
          lockedTypes={['ticket']}
          lockedProjectIds={projectIds}
        />

        <div className="min-h-0 flex-1 rounded-xl border border-border bg-card p-4">
          {!hasSearched ? (
            <p className="text-sm text-muted-foreground">Set your filters and click Search.</p>
          ) : searchLoading && results.length === 0 ? (
            <p className="text-sm text-muted-foreground">Searching…</p>
          ) : searchFailed ? (
            <p className="text-sm text-muted-foreground">Couldn't reach search right now.</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <TicketTree
                tickets={results}
                projects={projects ?? []}
                dimUnmatched
                generation={searchGeneration}
                selectedIds={selectedIds}
                onToggleSelect={(ticket, checked) => toggle(ticket, checked, ticket.projectId)}
                onLoadChildren={onTicketsLoaded}
                onOpenTicket={onOpenTicket}
              />

              {results.length < total && (
                <LoadMoreButton loaded={results.length} total={total} loading={searchLoading} onClick={handleLoadMore} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SprintTicketPicker;
