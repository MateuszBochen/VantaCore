import {useEffect, useMemo, useRef, useState} from 'react';
import {matchPath, useLocation, useNavigate} from 'react-router-dom';
import {Search} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useDebouncedCallback} from '@/lib/hooks/useDebouncedCallback';
import useGlobalSearchHook from '@/lib/Search/useGlobalSearchHook';
import type {
  GlobalSearchResult,
  SearchResultProject,
  SearchResultSubProject,
  SearchResultTestCase,
  SearchResultTicket,
  SearchScope,
} from '@/lib/Search/Type/types';

// GET /api/search doesn't exist on the backend yet (this repo is
// frontend-only, backend ships separately) - built against the documented
// contract anyway, same precedent as searchTicketsStub.ts. Until the
// endpoint lands this fails gracefully (the same try/catch -> {success:
// false} every other hook already uses) rather than crashing or faking data.
const RESULT_PREVIEW_COUNT = 5;

type FlatResult = {
  key: string;
  label: string;
  sublabel: string;
  onSelect: () => void;
};

type ResultSection = {
  id: string;
  label: string;
  total: number;
  visible: FlatResult[];
};

const GlobalSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {search} = useGlobalSearchHook();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GlobalSearchResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [scopeOverride, setScopeOverride] = useState<SearchScope | null>(null);

  const routeProjectId = useMemo(
    () => matchPath('/projects/:projectId/*', location.pathname)?.params.projectId ?? null,
    [location.pathname],
  );

  // Manual override only makes sense for the project view it was set on -
  // leaving (or switching) projects falls back to the contextual default
  // again, per VC-1033's "outside a project defaults to whole app". Reset
  // during render (state-vs-state comparison), not an effect - same
  // "derived-during-render" convention the old CommandPalette used for its
  // own query-change reset, since a setState-in-effect just cascades an
  // extra render for no benefit here.
  const [lastRouteProjectId, setLastRouteProjectId] = useState(routeProjectId);
  if (lastRouteProjectId !== routeProjectId) {
    setLastRouteProjectId(routeProjectId);
    if (scopeOverride !== null) {
      setScopeOverride(null);
    }
  }

  const scope: SearchScope = scopeOverride ?? (routeProjectId ? 'project' : 'global');

  const runSearch = useDebouncedCallback((value: string, currentScope: SearchScope, projectId: string | null) => {
    if (!value.trim()) {
      setResult(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    search(value, currentScope, projectId ?? undefined)
      .then((response) => setResult(response))
      // A future contract surprise (e.g. an envelope mismatch like the one
      // that shipped once already - see project memory) throws a non-Axios
      // error the hook re-throws rather than swallows; without this the
      // unhandled rejection would leave `loading` stuck true forever instead
      // of degrading to "couldn't reach search".
      .catch(() => setResult({success: false}))
      .finally(() => setLoading(false));
  }, 300);

  useEffect(() => {
    runSearch(query, scope, routeProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runSearch is useDebouncedCallback's stable wrapper (deps=[delayMs] only)
  }, [query, scope, routeProjectId]);

  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    if (expandedSections.size !== 0) {
      setExpandedSections(new Set());
    }
    if (highlightedIndex !== 0) {
      setHighlightedIndex(0);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Repurposes the app's existing ⌘K muscle memory - used to open a modal,
  // now just focuses the always-visible topbar input (see VC-1032: "visible
  // in the topbar on every view", not a modal you have to summon).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const goTo = (to: string) => {
    setOpen(false);
    setQuery('');
    navigate(to);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const sections = useMemo<ResultSection[]>(() => {
    if (!result || !result.success) {
      return [];
    }

    const build = <T,>(id: string, label: string, items: T[], toResult: (item: T) => FlatResult): ResultSection => {
      const visibleItems = expandedSections.has(id) ? items : items.slice(0, RESULT_PREVIEW_COUNT);
      return {id, label, total: items.length, visible: visibleItems.map(toResult)};
    };

    return [
      build('projects', 'Projects', result.projects, (project: SearchResultProject) => ({
        key: `project:${project.id}`,
        label: project.name,
        sublabel: 'Project',
        onSelect: () => goTo(`/projects/${project.id}`),
      })),
      build('subProjects', 'Sub-projects', result.subProjects, (subProject: SearchResultSubProject) => ({
        key: `subProject:${subProject.id}`,
        label: subProject.name,
        sublabel: 'Sub-project',
        onSelect: () => goTo(`/projects/${subProject.projectId}/documentation/sub-projects/${subProject.id}`),
      })),
      build('tickets', 'Tickets', result.tickets, (ticket: SearchResultTicket) => ({
        key: `ticket:${ticket.id}`,
        label: `${ticket.key} · ${ticket.title}`,
        sublabel: 'Ticket',
        onSelect: () => goTo(`/projects/${ticket.projectId}/tickets/${ticket.id}`),
      })),
      // No standalone route exists for a test case - it lives inside its
      // parent ticket's "Test Cases" tab (see TicketEditor.tsx's step ids).
      build('testCases', 'Test cases', result.testCases, (testCase: SearchResultTestCase) => ({
        key: `testCase:${testCase.id}`,
        label: testCase.title,
        sublabel: `Test case · ${testCase.ticketKey}`,
        onSelect: () => goTo(`/projects/${testCase.projectId}/tickets/${testCase.ticketId}?step=test-cases`),
      })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goTo closes over navigate/setOpen/setQuery, stable enough per render
  }, [result, expandedSections]);

  const flatResults = useMemo(() => sections.flatMap((section) => section.visible), [sections]);

  const [lastFlatLength, setLastFlatLength] = useState(flatResults.length);
  if (lastFlatLength !== flatResults.length) {
    setLastFlatLength(flatResults.length);
    const clampedIndex = Math.min(highlightedIndex, Math.max(flatResults.length - 1, 0));
    if (clampedIndex !== highlightedIndex) {
      setHighlightedIndex(clampedIndex);
    }
  }

  const hasQuery = query.trim().length > 0;
  const hasAnyResults = flatResults.length > 0;
  const failed = result !== null && !result.success;

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setScopeOverride('project')}
          disabled={!routeProjectId}
          title={routeProjectId ? undefined : 'Open a project to search within it'}
          className={cn(
            'rounded-md px-2 py-1 transition-colors',
            scope === 'project' ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-foreground',
            !routeProjectId && 'cursor-not-allowed opacity-40',
          )}
        >
          This project
        </button>
        <button
          type="button"
          onClick={() => setScopeOverride('global')}
          className={cn(
            'rounded-md px-2 py-1 transition-colors',
            scope === 'global' ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Whole app
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setHighlightedIndex((current) => Math.min(current + 1, flatResults.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setHighlightedIndex((current) => Math.max(current - 1, 0));
            } else if (event.key === 'Enter') {
              flatResults[highlightedIndex]?.onSelect();
            }
          }}
          placeholder="Search…"
          className="h-9 w-72 rounded-lg border border-(--input-border) bg-(--input-background) py-1 pl-8 pr-12 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </span>

        {open && (
          <div className="absolute right-0 top-full z-20 mt-2 max-h-96 w-96 overflow-y-auto rounded-xl border border-border bg-popover py-1.5 shadow-xl backdrop-blur-xl">
            {!hasQuery ? (
              <p className="px-4 py-4 text-sm text-muted-foreground">Type to search, or jump straight to advanced filters below.</p>
            ) : loading && !result ? (
              <p className="px-4 py-4 text-sm text-muted-foreground">Loading…</p>
            ) : failed ? (
              <p className="px-4 py-4 text-sm text-muted-foreground">Couldn't reach search right now.</p>
            ) : !hasAnyResults ? (
              <p className="px-4 py-4 text-sm text-muted-foreground">No matches.</p>
            ) : (
              sections.map((section) =>
                section.total === 0 ? null : (
                  <div key={section.id} className="border-b border-border py-1 last:border-0">
                    <p className="px-4 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{section.label}</p>
                    {section.visible.map((item) => {
                      const index = flatResults.findIndex((flat) => flat.key === item.key);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={item.onSelect}
                          className={cn(
                            'flex w-full flex-col items-start gap-0.5 px-4 py-1.5 text-left',
                            index === highlightedIndex ? 'bg-muted' : 'hover:bg-muted',
                          )}
                        >
                          <span className="truncate text-sm text-foreground">{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.sublabel}</span>
                        </button>
                      );
                    })}
                    {section.total > RESULT_PREVIEW_COUNT && (
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full px-4 py-1.5 text-left text-xs font-medium text-accent hover:underline"
                      >
                        {expandedSections.has(section.id) ? 'Show less' : `Show all (${section.total})`}
                      </button>
                    )}
                  </div>
                ),
              )
            )}

            <button
              type="button"
              onClick={() => goTo(`/search?q=${encodeURIComponent(query)}`)}
              className="w-full border-t border-border px-4 py-2 text-left text-xs font-medium text-accent hover:bg-muted"
            >
              Advanced search →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
