import {useEffect, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import useAdvancedSearchHook from '@/lib/Search/useAdvancedSearchHook';
import {buildAdvancedSearchQuery, parseAdvancedSearchFiltersFromQuery} from '@/lib/Search/advancedSearchQuery';
import AdvancedSearchFilters from './AdvancedSearchFilters';
import TicketPopup, {type TicketPopupHandle} from '../Project/Tickets/TicketPopup';
import TicketTree from '@/components/TicketTree/TicketTree';
import {LoadMoreButton} from '@/components/ui/load-more-button';
import useGetProjectHook from '@/lib/Project/useGetProjectHook';
import toTicketSummary from '@/lib/Ticket/toTicketSummary';
import type {Project} from '@/lib/Project/Type/types';
import type {TicketSummary} from '@/lib/Ticket/Type/types';
import type {AdvancedSearchFilters as Filters, SearchResultType} from '@/lib/Search/Type/types';
import type {GlobalSearchResult, SearchResultProject, SearchResultSubProject, SearchResultTestCase} from '@/lib/Search/Type/types';

const TICKETS_PAGE_LIMIT = 25;
const ALL_TYPES: SearchResultType[] = ['project', 'subProject', 'ticket', 'testCase'];
const EMPTY_RESULT: GlobalSearchResult = {success: true, projects: [], subProjects: [], tickets: [], testCases: []};

// No types picked means every type, same as the API's own default.
const effectiveTypes = (filters: Filters): SearchResultType[] => (filters.types.length > 0 ? filters.types : ALL_TYPES);

type FlatResult = {
  key: string;
  label: string;
  sublabel: string;
  // A real route, not just an onSelect callback - rows render as actual
  // <Link>s so a plain left click, ctrl/cmd-click, and middle-click all
  // behave the way every other link on the web does (open here / open in a
  // new tab), instead of the previous plain <button onClick> that could
  // only ever navigate the current tab.
  to: string;
  // Ticket rows only - a plain left click (no modifier keys) opens the
  // ticket in TicketPopup instead of following `to` away from the results,
  // the same quick-view pattern SprintSummaryPage/SprintBoardPage already
  // use. Ctrl/cmd/middle-click still fall through to the real link, since
  // those are "give me a new tab", not "quick-look here".
  onPlainClick?: () => void;
};

type ResultSection = {
  id: string;
  label: string;
  items: FlatResult[];
};

const AdvancedSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {search, searchTicketsFull} = useAdvancedSearchHook();
  const {getProject} = useGetProjectHook();
  const ticketPopupRef = useRef<TicketPopupHandle>(null);

  const [filters, setFilters] = useState<Filters>(() => parseAdvancedSearchFiltersFromQuery(searchParams));
  // Starts already-loading when the URL arrived with search params on it
  // (e.g. Back navigation to a search left by handleSubmit below) - the
  // mount effect further down only has to kick off the fetch itself then,
  // not flip these on top of it (see fetchResults vs runSearch).
  const [loading, setLoading] = useState(() => Object.keys(buildAdvancedSearchQuery(filters)).length > 0);
  const [result, setResult] = useState<GlobalSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(loading);

  // The Tickets section is a separate fullMode search (full ticket objects -
  // childCount, parentId, statuses... - which TicketTree needs), paged on its
  // own; `search` above only covers the other sections now.
  const [ticketResults, setTicketResults] = useState<TicketSummary[]>([]);
  const [ticketTotal, setTicketTotal] = useState(0);
  const [ticketPage, setTicketPage] = useState(0);
  const [ticketsLoadingMore, setTicketsLoadingMore] = useState(false);
  const [ticketsFailed, setTicketsFailed] = useState(false);
  const [ticketGeneration, setTicketGeneration] = useState(0);
  // Filters the current results were fetched with - "Load more" must page
  // THOSE, not whatever was edited in the panel since.
  const [ranFilters, setRanFilters] = useState<Filters>(filters);
  // Issue types/statuses/flags for the tree's pills - fetched once per
  // project that shows up in the ticket results, kept across searches.
  const [projectsById, setProjectsById] = useState<Record<string, Project>>({});

  const handleChange = (patch: Partial<Filters>) => setFilters((current) => ({...current, ...patch}));

  const loadMissingProjects = (tickets: TicketSummary[]) => {
    const missing = Array.from(new Set(tickets.map((ticket) => ticket.projectId))).filter((id) => !projectsById[id]);

    missing.forEach((id) => {
      getProject(id).then((projectResult) => {
        if (projectResult.success) {
          setProjectsById((current) => ({...current, [id]: projectResult.project}));
        }
      });
    });
  };

  const fetchTickets = (filtersToRun: Filters, page: number) =>
    searchTicketsFull({...filtersToRun, types: ['ticket']}, page, TICKETS_PAGE_LIMIT).then((ticketResult) => {
      if (!ticketResult.success) {
        setTicketsFailed(true);
        return;
      }

      const mapped = ticketResult.tickets.map(toTicketSummary);
      setTicketsFailed(false);
      setTicketTotal(ticketResult.total);
      setTicketPage(page);
      setTicketResults((current) => (page === 0 ? mapped : [...current, ...mapped]));
      loadMissingProjects(mapped);
    });

  const fetchResults = (filtersToRun: Filters) => {
    const types = effectiveTypes(filtersToRun);
    const otherTypes = types.filter((type) => type !== 'ticket');

    Promise.all([
      otherTypes.length > 0 ? search({...filtersToRun, types: otherTypes}).then(setResult) : Promise.resolve().then(() => setResult(EMPTY_RESULT)),
      types.includes('ticket') ? fetchTickets(filtersToRun, 0) : Promise.resolve(),
    ])
      .catch(() => setResult({success: false}))
      .finally(() => setLoading(false));
  };

  // Resets the previous ticket results here rather than in fetchResults -
  // that one also runs from the mount-restore effect below, where this
  // state is still at its (already empty) initial values anyway.
  const runSearch = (filtersToRun: Filters) => {
    setLoading(true);
    setHasSearched(true);
    setRanFilters(filtersToRun);
    setTicketGeneration((current) => current + 1);
    setTicketResults([]);
    setTicketTotal(0);
    fetchResults(filtersToRun);
  };

  const handleLoadMoreTickets = () => {
    setTicketsLoadingMore(true);
    fetchTickets(ranFilters, ticketPage + 1)
      .catch(() => setTicketsFailed(true))
      .finally(() => setTicketsLoadingMore(false));
  };

  // Restores a previous search's actual RESULTS on mount, not just the
  // filter inputs - e.g. after Back navigation from a result, whose URL got
  // these same params written into it by handleSubmit below. `replace:
  // true` there (not the default push) means filter tweaks never pile up
  // separate history entries of their own, so this only ever needs to run
  // once, right when the page itself is first reached - `loading`/
  // `hasSearched` are already correct from their own initial state above,
  // this only starts the actual fetch.
  useEffect(() => {
    if (loading) {
      fetchResults(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot restore for this mount's own initial filters/loading state, not meant to re-run
  }, []);

  const handleSubmit = () => {
    setSearchParams(buildAdvancedSearchQuery(filters), {replace: true});
    runSearch(filters);
  };

  const sections: ResultSection[] = !result || !result.success
    ? []
    : [
        {
          id: 'projects',
          label: 'Projects',
          items: result.projects.map((project: SearchResultProject) => ({
            key: `project:${project.id}`,
            label: project.name,
            sublabel: 'Project',
            to: `/projects/${project.id}`,
          })),
        },
        {
          id: 'subProjects',
          label: 'Sub-projects',
          items: result.subProjects.map((subProject: SearchResultSubProject) => ({
            key: `subProject:${subProject.id}`,
            label: subProject.name,
            sublabel: 'Sub-project',
            to: `/projects/${subProject.projectId}/documentation/sub-projects/${subProject.id}`,
          })),
        },
        {
          id: 'testCases',
          label: 'Test cases',
          items: result.testCases.map((testCase: SearchResultTestCase) => ({
            key: `testCase:${testCase.id}`,
            label: testCase.title,
            sublabel: `Test case · ${testCase.ticketKey}`,
            to: `/projects/${testCase.projectId}/tickets/${testCase.ticketId}?step=test-cases`,
          })),
        },
      ];

  const failed = result !== null && !result.success;
  const totalResults = sections.reduce((sum, section) => sum + section.items.length, 0) + ticketResults.length;
  const treeProjects = Object.values(projectsById);
  const hasMoreTickets = ticketResults.length < ticketTotal;

  const ticketSection =
    ticketResults.length > 0 || ticketsFailed ? (
      <div key="tickets" className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tickets ({ticketTotal})</p>
        {ticketsFailed && ticketResults.length === 0 ? (
          <p className="text-sm text-muted-foreground">Couldn't load tickets right now.</p>
        ) : (
          <>
            <TicketTree
              tickets={ticketResults}
              projects={treeProjects}
              dimUnmatched
              generation={ticketGeneration}
              onOpenTicket={(ticket) => ticketPopupRef.current?.open(ticket.projectId, ticket.id, ticket.key)}
            />
            {hasMoreTickets && (
              <LoadMoreButton loaded={ticketResults.length} total={ticketTotal} loading={ticketsLoadingMore} onClick={handleLoadMoreTickets} />
            )}
          </>
        )}
      </div>
    ) : null;

  return (
    <div className="flex h-full min-h-0 w-full gap-4 p-4">
      <AdvancedSearchFilters filters={filters} onChange={handleChange} onSubmit={handleSubmit} loading={loading} />

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4">
        {!hasSearched ? (
          <p className="text-sm text-muted-foreground">Set your filters and click Search.</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Searching…</p>
        ) : failed ? (
          <p className="text-sm text-muted-foreground">Couldn't reach search right now.</p>
        ) : totalResults === 0 ? (
          <p className="text-sm text-muted-foreground">No matches.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {sections.flatMap((section) => [
              section.id === 'testCases' ? ticketSection : null,
              section.items.length === 0 ? null : (
                <div key={section.id} className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {section.label} ({section.items.length})
                  </p>
                  <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                    {section.items.map((item) => (
                      <Link
                        key={item.key}
                        to={item.to}
                        onClick={(e) => {
                          if (item.onPlainClick && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                            e.preventDefault();
                            item.onPlainClick();
                          }
                        }}
                        className="flex flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted"
                      >
                        <span className="truncate text-sm text-foreground">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.sublabel}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ),
            ])}
          </div>
        )}
      </div>

      <TicketPopup ref={ticketPopupRef} storageKey="search-ticket-popup" />
    </div>
  );
};

export default AdvancedSearchPage;
