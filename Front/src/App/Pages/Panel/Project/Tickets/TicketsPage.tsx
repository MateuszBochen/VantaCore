import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {PageContainer} from '@/components/ui/page-container';
import {Button} from '@/components/ui/button';
import {LoadMoreButton} from '@/components/ui/load-more-button';
import useProjectFromRoute from '../useProjectFromRoute';
import {useSetModuleTitle} from '../../ModuleTitle';
import useGetTicketsHook from '@/lib/Ticket/useGetTicketsHook';
import type {TicketSummary} from '@/lib/Ticket/Type/types';
import useAdvancedSearchHook from '@/lib/Search/useAdvancedSearchHook';
import {DEFAULT_ADVANCED_SEARCH_FILTERS} from '@/lib/Search/defaultAdvancedSearchFilters';
import type {AdvancedSearchFilters as SearchFilters} from '@/lib/Search/Type/types';
import toTicketSummary from '@/lib/Ticket/toTicketSummary';
import {rememberTicketsListSearch, toTicketsListQuery} from '@/lib/Ticket/ticketsListSearch';
import {parseAdvancedSearchFiltersFromQuery} from '@/lib/Search/advancedSearchQuery';
import {useSearchParams} from 'react-router-dom';
import AdvancedSearchFilters from '../../Search/AdvancedSearchFilters';
import {eventBus} from '@/lib/EventBus/EventBus';
import {TicketWasCreatedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasCreatedRemoteEvent';
import {TicketWasChangedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasChangedRemoteEvent';
import {TicketWasDeletedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasDeletedRemoteEvent';
import applyTicketChangedPayload from '@/lib/Ticket/applyTicketChangedPayload';
import applyTicketDeletedPayload from '@/lib/Ticket/applyTicketDeletedPayload';
import TicketTree from '@/components/TicketTree/TicketTree';
import TicketBulkActionsToolbar from './TicketBulkActionsToolbar';

// Best-effort only - the websocket payload shape isn't confirmed with the
// backend yet, so this reads a couple of likely field names instead of
// assuming one exact shape. Returns null (not "no match") when it can't tell,
// so the caller can choose to refetch anyway rather than silently miss it.
const extractProjectId = (payload: unknown): string | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const projectId = record.projectId ?? record.project_id;

  return typeof projectId === 'string' ? projectId : null;
};

const SEARCH_PAGE_LIMIT = 25;
const ROOT_PAGE_LIMIT = 25;

// Appends a "Load more" page, skipping anything already listed - the next
// page is picked by the loaded count (see handleLoadMoreRoots), so a ticket
// created/deleted elsewhere in the meantime shifts the server's offsets and
// can repeat an already-loaded row at the page boundary.
const appendUnique = (current: TicketSummary[], next: TicketSummary[]): TicketSummary[] => {
  const known = new Set(current.map((ticket) => ticket.id));
  return [...current, ...next.filter((ticket) => !known.has(ticket.id))];
};

// Root-only list, expandable into children per row (see TicketTree) - Kanban/
// rail-style visualization lives in the Sprints module instead (see memory:
// project_vantacore_boards_concept), this is the plain backlog list.
// The left-hand search panel is the same AdvancedSearchFilters the New Sprint
// ticket picker uses (locked to tickets from this project). Until the first
// Search the list shows the root backlog as before; after it, the flat
// search hits instead (children included, since search matches any ticket),
// until Reset brings the root list back.
const TicketsPage = () => {
  const {project, state} = useProjectFromRoute();
  const {getTickets} = useGetTicketsHook();
  const {searchTicketsFull} = useAdvancedSearchHook();
  const [rootTickets, setRootTickets] = useState<TicketSummary[] | null>(null);
  // meta.total of the root list - "Load more" is offered while fewer than
  // this many roots are loaded (the endpoint pages, 25 at a time).
  const [rootTotal, setRootTotal] = useState(0);
  const [rootLoadingMore, setRootLoadingMore] = useState(false);
  // How many roots are currently loaded, readable from the websocket
  // handlers' long-lived closures - a refetch reloads that many (rounded up
  // to whole pages) instead of collapsing the list back to the first page.
  const loadedRootCountRef = useRef(0);
  useEffect(() => {
    loadedRootCountRef.current = rootTickets?.length ?? 0;
  }, [rootTickets]);
  // The search lives in the URL too (toTicketsListQuery), so refresh, a
  // shared link, browser back and the ticket view's "← Tickets" all land on
  // the same results. Seeded from it on mount; types/projectIds aren't in
  // the URL - they're locked to tickets/this project below.
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(() =>
    searchParams.size > 0 ? parseAdvancedSearchFiltersFromQuery(searchParams) : null,
  );
  // Whether the URL-seeded search (if any) was already run for this mount.
  const restoredSearch = useRef(false);
  // null = no search run yet (root backlog list is shown instead).
  const [searchResults, setSearchResults] = useState<TicketSummary[] | null>(null);
  const [searchPage, setSearchPage] = useState(0);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  // Bumped on every fresh search and folded into each row's key - same
  // reason as SprintTicketPicker's searchGeneration: a reused row would keep
  // its expanded children from the previous result set.
  const [searchGeneration, setSearchGeneration] = useState(0);
  // Checkbox selection for bulk actions - a separate concept from the status/
  // priority filters above. Any currently-rendered row can be selected
  // (roots always are; an expanded ticket's children too, once loaded) via
  // TicketTree's optional selectedIds/onToggleSelect props - "Select all"
  // below only ever reaches root-level tickets, since collapsed children
  // aren't loaded/known about yet.
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());

  useSetModuleTitle(project ? `${project.name} - Tickets` : null);

  // Full refresh that keeps however many pages were already loaded.
  const reloadRoots = (projectId: string) => {
    const pages = Math.max(1, Math.ceil(loadedRootCountRef.current / ROOT_PAGE_LIMIT));

    getTickets(projectId, undefined, 0, pages * ROOT_PAGE_LIMIT).then((result) => {
      if (result.success) {
        setRootTickets(result.tickets);
        setRootTotal(result.total);
      }
    });
  };

  const handleLoadMoreRoots = () => {
    if (!project || !rootTickets) {
      return;
    }

    setRootLoadingMore(true);
    getTickets(project.id, undefined, Math.floor(rootTickets.length / ROOT_PAGE_LIMIT), ROOT_PAGE_LIMIT)
      .then((result) => {
        if (result.success) {
          setRootTickets((current) => (current ? appendUnique(current, result.tickets) : result.tickets));
          setRootTotal(result.total);
        }
      })
      .finally(() => setRootLoadingMore(false));
  };

  useEffect(() => {
    if (!project) {
      return;
    }

    let cancelled = false;

    getTickets(project.id, undefined, 0, ROOT_PAGE_LIMIT).then((result) => {
      if (!cancelled && result.success) {
        setRootTickets(result.tickets);
        setRootTotal(result.total);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTickets is a thin useRequestHook wrapper recreated every render
  }, [project?.id]);

  useEffect(() => {
    if (!project) {
      return;
    }

    const handleTicketCreatedRemotely = (remoteEvent: TicketWasCreatedRemoteEvent) => {
      const remoteProjectId = extractProjectId(remoteEvent.payload);

      if (remoteProjectId !== null && remoteProjectId !== project.id) {
        return;
      }

      reloadRoots(project.id);
    };

    eventBus.subscribe<TicketWasCreatedRemoteEvent>(TicketWasCreatedRemoteEvent.name, handleTicketCreatedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasCreatedRemoteEvent>(TicketWasCreatedRemoteEvent.name, handleTicketCreatedRemotely);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTickets is a thin useRequestHook wrapper recreated every render
  }, [project?.id]);

  // Patches the matching row in place rather than refetching the whole list
  // - a refetch would also collapse any row the user had expanded.
  useEffect(() => {
    const handleTicketChangedRemotely = (remoteEvent: TicketWasChangedRemoteEvent) => {
      setRootTickets((current) => (current ? applyTicketChangedPayload(current, remoteEvent.payload) : current));
      setSearchResults((current) => (current ? applyTicketChangedPayload(current, remoteEvent.payload) : current));
    };

    eventBus.subscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);
    };
  }, []);

  // Same idea, for a ticket deleted elsewhere - removes it from the root
  // list in place rather than refetching (which would also collapse any
  // expanded rows).
  useEffect(() => {
    const handleTicketDeletedRemotely = (remoteEvent: TicketWasDeletedRemoteEvent) => {
      setRootTickets((current) => (current ? applyTicketDeletedPayload(current, remoteEvent.payload) : current));
      setSearchResults((current) => (current ? applyTicketDeletedPayload(current, remoteEvent.payload) : current));
    };

    eventBus.subscribe<TicketWasDeletedRemoteEvent>(TicketWasDeletedRemoteEvent.name, handleTicketDeletedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasDeletedRemoteEvent>(TicketWasDeletedRemoteEvent.name, handleTicketDeletedRemotely);
    };
  }, []);

  const defaultSearchFilters = useMemo<SearchFilters | null>(
    () => (project ? {...DEFAULT_ADVANCED_SEARCH_FILTERS, types: ['ticket'], projectIds: [project.id]} : null),
    [project],
  );
  const activeSearchFilters = useMemo<SearchFilters | null>(
    () => (searchFilters && project ? {...searchFilters, types: ['ticket'], projectIds: [project.id]} : defaultSearchFilters),
    [searchFilters, project, defaultSearchFilters],
  );

  const handleSearchFiltersChange = (patch: Partial<SearchFilters>) =>
    setSearchFilters((current) => {
      const base = current ?? defaultSearchFilters;
      return base ? {...base, ...patch} : current;
    });

  // Fresh search (page 0, replaces) or "Load more" (next page, appends) -
  // offered while fewer than the tickets section's total are loaded.
  const runSearch = (targetPage: number, append: boolean) => {
    if (!activeSearchFilters) {
      return;
    }

    setSearchLoading(true);
    if (!append) {
      setSearchGeneration((current) => current + 1);
      setSelectedTicketIds(new Set());

      const query = toTicketsListQuery(activeSearchFilters);
      setSearchParams(query, {replace: true});
      rememberTicketsListSearch(activeSearchFilters.projectIds[0], new URLSearchParams(query).toString());
    }

    searchTicketsFull(activeSearchFilters, targetPage, SEARCH_PAGE_LIMIT)
      .then((result) => {
        if (!result.success) {
          setSearchFailed(true);
          return;
        }

        setSearchFailed(false);
        setSearchTotal(result.total);
        setSearchPage(targetPage);

        const mapped = result.tickets.map(toTicketSummary);
        setSearchResults((current) => (append && current ? [...current, ...mapped] : mapped));
      })
      .catch(() => setSearchFailed(true))
      .finally(() => setSearchLoading(false));
  };

  const handleSearchSubmit = () => runSearch(0, false);
  const handleLoadMore = () => runSearch(searchPage + 1, true);

  const handleResetSearch = () => {
    setSearchParams({}, {replace: true});
    if (project) {
      rememberTicketsListSearch(project.id, '');
    }
    setSearchFilters(null);
    setSearchResults(null);
    setSearchFailed(false);
    setSelectedTicketIds(new Set());
  };

  // Runs the search the page was opened with (?q=..., e.g. via "← Tickets"
  // or a shared link) once the project is known. Deferred a tick, same as
  // SprintTicketPicker's initial search: runSearch sets state synchronously
  // before its own async call, which an effect body mustn't do directly.
  useEffect(() => {
    if (!project || restoredSearch.current) {
      return;
    }

    restoredSearch.current = true;

    if (searchFilters) {
      Promise.resolve().then(() => runSearch(0, false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot restore for this mount, once the project has loaded
  }, [project]);

  const visibleTickets = searchResults ?? rootTickets;
  const treeProjects = useMemo(() => (project ? [project] : []), [project]);

  const handleToggleSelect = useCallback((ticketId: string) => {
    setSelectedTicketIds((current) => {
      const next = new Set(current);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  }, []);

  const handleSelectAllRoots = () => setSelectedTicketIds(new Set((visibleTickets ?? []).map((ticket) => ticket.id)));
  const handleClearSelection = () => setSelectedTicketIds(new Set());

  // Fields the bulk toolbar can change (status/assignee/flags/...) just
  // changed server-side - refetch rather than trying to patch every possible
  // field locally, same reasoning TicketWasCreatedRemoteEvent's handler
  // already uses for a full-list refresh.
  const handleBulkApplied = () => {
    if (!project) {
      return;
    }

    setSelectedTicketIds(new Set());
    reloadRoots(project.id);

    if (searchResults !== null) {
      runSearch(0, false);
    }
  };

  if (state === 'loading' || !project) {
    return <div className="p-8 text-sm text-muted-foreground">Loading project…</div>;
  }

  if (state === 'error') {
    return <div className="p-8 text-sm text-muted-foreground">Couldn't load this project.</div>;
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Tickets</p>

        <div className="flex items-center gap-1">
          {searchResults !== null && (
            <Button variant="ghost" size="sm" onClick={handleResetSearch} className="text-muted-foreground">
              Reset search
            </Button>
          )}

          {visibleTickets !== null && visibleTickets.length > 0 && selectedTicketIds.size === 0 && (
            <Button variant="ghost" size="sm" onClick={handleSelectAllRoots} className="text-muted-foreground">
              Select all
            </Button>
          )}
        </div>
      </div>

      {selectedTicketIds.size > 0 && (
        <TicketBulkActionsToolbar
          project={project}
          selectedIds={Array.from(selectedTicketIds)}
          onClearSelection={handleClearSelection}
          onApplied={handleBulkApplied}
        />
      )}

      <div className="flex min-h-0 flex-1 gap-4">
        {activeSearchFilters && (
          <AdvancedSearchFilters
            filters={activeSearchFilters}
            onChange={handleSearchFiltersChange}
            onSubmit={handleSearchSubmit}
            loading={searchLoading}
            lockedTypes={['ticket']}
            lockedProjectIds={[project.id]}
          />
        )}

        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-card p-5">
          {searchFailed ? (
            <p className="text-sm text-muted-foreground">Couldn't reach search right now.</p>
          ) : visibleTickets === null ? (
            <p className="text-sm text-muted-foreground">{searchLoading ? 'Searching…' : 'Loading tickets…'}</p>
          ) : visibleTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{searchResults !== null ? 'No matches.' : 'No tickets yet.'}</p>
          ) : (
            <div className="flex flex-col gap-2">
              <TicketTree
                tickets={visibleTickets}
                projects={treeProjects}
                dimUnmatched={searchResults !== null}
                generation={searchResults !== null ? searchGeneration : 'root'}
                selectedIds={selectedTicketIds}
                onToggleSelect={(ticket) => handleToggleSelect(ticket.id)}
              />

              {searchResults === null && rootTickets !== null && rootTickets.length < rootTotal && (
                <LoadMoreButton loaded={rootTickets.length} total={rootTotal} loading={rootLoadingMore} onClick={handleLoadMoreRoots} />
              )}

              {searchResults !== null && searchResults.length < searchTotal && (
                <LoadMoreButton loaded={searchResults.length} total={searchTotal} loading={searchLoading} onClick={handleLoadMore} />
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default TicketsPage;
