import {useCallback, useEffect, useState, type MouseEvent} from 'react';
import {Link} from 'react-router-dom';
import {ChevronDown, ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import {UserChip} from '@/components/ui/user-chip';
import useGetTicketsHook from '@/lib/Ticket/useGetTicketsHook';
import applyTicketChangedPayload from '@/lib/Ticket/applyTicketChangedPayload';
import applyTicketDeletedPayload from '@/lib/Ticket/applyTicketDeletedPayload';
import {eventBus} from '@/lib/EventBus/EventBus';
import {TicketWasChangedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasChangedRemoteEvent';
import {TicketWasDeletedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasDeletedRemoteEvent';
import type {Project} from '@/lib/Project/Type/types';
import {PRIORITIES} from '@/lib/Ticket/Type/types';
import type {TicketSummary} from '@/lib/Ticket/Type/types';
import {cn} from '@/lib/utils';

const CHILD_PAGE_LIMIT = 25;

export type TicketTreeRowProps = {
  ticket: TicketSummary;
  depth: number;
  // Issue types/statuses/flags are per-project catalogs, and a tree can mix
  // projects (a board spanning several, or the app-wide /search page) - a
  // descendant always belongs to its parent's project, so the same lookup
  // works at every depth.
  projectsById: Record<string, Project>;
  // Both omitted = no checkbox at all (AdvancedSearchPage). Any level can be
  // selected, not only roots - a Sprint can include any ticket, and
  // TicketsPage's bulk actions work on children too.
  selectedIds?: Set<string>;
  onToggleSelect?: (ticket: TicketSummary, checked: boolean) => void;
  // Reports fetched children up to the host - SprintTicketPicker's estimate
  // summary needs a selected ticket's data even once its row is collapsed.
  onLoadChildren?: (children: TicketSummary[]) => void;
  // Given: a plain click on the key/title opens the ticket in the host's
  // TicketPopup, modifier/middle clicks still fall through to the real href
  // (new tab). Omitted: they're just normal links to the ticket page.
  onOpenTicket?: (ticket: TicketSummary) => void;
  // A flat search result set can independently match both a ticket and one
  // of its own children - without this, the child would render twice: once
  // as its parent's (still-collapsed) descendant, and once as its own
  // unrelated top-level row. TicketTree instead nests it here and asks this
  // row to open pre-expanded, at every depth.
  getKnownChildren?: (ticketId: string) => TicketSummary[] | undefined;
  // Ids the current search actually returned - anything else rendered here
  // (siblings pulled in by expanding a row, which fetches the full,
  // unfiltered child list) is context only, shown dimmed so the filter's
  // real result set stays readable. Omitted = nothing is dimmed (a plain,
  // unfiltered list).
  matchedIds?: Set<string>;
};

// One row of TicketTree, recursive - children are fetched lazily on first
// expand so opening the list doesn't walk the whole (unbounded-depth) tree.
// Extracted from SprintTicketPicker's row so the New Sprint picker,
// TicketsPage and AdvancedSearchPage's ticket section all render the same
// tree.
const TicketTreeRow = ({
  ticket,
  depth,
  projectsById,
  selectedIds,
  onToggleSelect,
  onLoadChildren,
  onOpenTicket,
  getKnownChildren,
  matchedIds,
}: TicketTreeRowProps) => {
  const {getTickets} = useGetTicketsHook();
  const project = projectsById[ticket.projectId];
  const status = project?.statuses.find((candidate) => candidate.id === ticket.statusId);
  const issueType = project?.issueTypes.find((candidate) => candidate.id === ticket.issueTypeId);
  const flags = project?.flags.filter((flag) => ticket.flagIds.includes(flag.id)) ?? [];
  const priority = PRIORITIES.find((candidate) => candidate.level === ticket.priority);
  const hasMeta = flags.length > 0 || ticket.tags.length > 0 || ticket.assigneeIds.length > 0;
  const knownChildren = getKnownChildren?.(ticket.id);
  const [expanded, setExpanded] = useState(Boolean(knownChildren && knownChildren.length > 0));
  const [children, setChildren] = useState<TicketSummary[] | null>(knownChildren ?? null);
  // knownChildren is only a preview - whichever of this ticket's children
  // the same search also matched. It's deliberately NOT auto-completed with
  // the full child list: that silently mixed filtered-out children (e.g.
  // estimated ones under a "no estimation" search) back into the results.
  // The full list is fetched only on explicit request - expanding a
  // collapsed row, or "Show all sub-tickets" under a preview.
  const [fullyLoaded, setFullyLoaded] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const dimmed = matchedIds !== undefined && !matchedIds.has(ticket.id);

  const loadAllChildren = useCallback(() => {
    setLoadingChildren(true);
    // The list endpoint pages (25 by default) - ask for all of them at once,
    // childCount says how many there are.
    getTickets(ticket.projectId, ticket.id, 0, Math.max(CHILD_PAGE_LIMIT, ticket.childCount)).then((result) => {
      setLoadingChildren(false);

      if (result.success) {
        setChildren(result.tickets);
        setFullyLoaded(true);
        onLoadChildren?.(result.tickets);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTickets is a thin useRequestHook wrapper recreated every render
  }, [ticket.projectId, ticket.id, ticket.childCount]);

  // Each row patches only its own loaded children level; this row's own
  // `ticket` is patched by whoever owns it (the parent row, or the host for
  // roots).
  useEffect(() => {
    const handleTicketChangedRemotely = (remoteEvent: TicketWasChangedRemoteEvent) => {
      setChildren((current) => (current ? applyTicketChangedPayload(current, remoteEvent.payload) : current));
    };

    eventBus.subscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);
    };
  }, []);

  useEffect(() => {
    const handleTicketDeletedRemotely = (remoteEvent: TicketWasDeletedRemoteEvent) => {
      setChildren((current) => (current ? applyTicketDeletedPayload(current, remoteEvent.payload) : current));
    };

    eventBus.subscribe<TicketWasDeletedRemoteEvent>(TicketWasDeletedRemoteEvent.name, handleTicketDeletedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasDeletedRemoteEvent>(TicketWasDeletedRemoteEvent.name, handleTicketDeletedRemotely);
    };
  }, []);

  // Key and title both open the ticket - a plain click in the host's popup
  // when it has one, modifier/middle clicks always fall through to the real
  // href (new tab).
  const ticketHref = `/projects/${ticket.projectId}/tickets/${ticket.id}`;
  const handleOpenClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onOpenTicket && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      onOpenTicket(ticket);
    }
  };

  const handleToggleExpand = useCallback(() => {
    setExpanded((current) => !current);

    if (children === null) {
      loadAllChildren();
    }
  }, [children, loadAllChildren]);

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn('flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2 transition-opacity', dimmed && 'opacity-50')}
        style={{marginLeft: depth * 20}}
        title={dimmed ? "Doesn't match the current filters" : undefined}
      >
        <div className="flex items-center gap-2">
          {ticket.childCount > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              disableRipple
              onClick={handleToggleExpand}
              className="h-5 w-5 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </Button>
          ) : (
            // Leaf ticket - no expander, just a same-sized spacer so the
            // key/title column still lines up with sibling rows that have one.
            <span className="h-5 w-5 shrink-0" />
          )}

          {onToggleSelect && (
            <Checkbox checked={selectedIds?.has(ticket.id) ?? false} onCheckedChange={(checked) => onToggleSelect(ticket, checked)} />
          )}

          {priority && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{backgroundColor: priority.color}}
              title={`Priority: ${priority.name}`}
            />
          )}

          <Link
            to={ticketHref}
            onClick={handleOpenClick}
            className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-accent hover:underline"
          >
            {ticket.key}
          </Link>

          {issueType && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{backgroundColor: `${issueType.color}33`, color: issueType.color}}
            >
              {issueType.name}
            </span>
          )}

          {status && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{backgroundColor: `${status.color}33`, color: status.color}}
            >
              {status.name}
            </span>
          )}

          <Link to={ticketHref} onClick={handleOpenClick} className="min-w-0 flex-1 truncate text-sm text-foreground hover:opacity-80">
            {ticket.title}
          </Link>
          {ticket.progress !== null && (
            <div className="flex shrink-0 items-center gap-2" title="Progress">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-cyan-400" style={{width: `${ticket.progress}%`}} />
              </div>
              <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">{ticket.progress}%</span>
            </div>
          )}

          <span className="shrink-0 text-xs text-muted-foreground" title="Total time logged">
            {Math.floor(ticket.timeSpentAll / 60)}h {ticket.timeSpentAll % 60}m
          </span>

          <span className="shrink-0 text-xs text-muted-foreground" title="Estimate">
            {ticket.estimate ?? '—'}
          </span>
        </div>

        {hasMeta && (
          // Aligned past the expander+checkbox+key columns above, not a fixed
          // indent - so flags/tags/assignees visually belong to this row's
          // title rather than reading as a sibling of the expander.
          <div className="ml-7 flex flex-wrap items-center gap-1">
            {flags.map((flag) => (
              <span
                key={flag.id}
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{backgroundColor: `${flag.color}33`, color: flag.color}}
              >
                {flag.name}
              </span>
            ))}

            {ticket.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {tag}
              </span>
            ))}

            {ticket.assigneeIds.map((id) => (
              <UserChip key={id} userId={id} className="py-0 text-[10px]" />
            ))}
          </div>
        )}
      </div>

      {expanded && (
        <div className="flex flex-col gap-1">
          {loadingChildren && children === null ? (
            <p className="text-xs text-muted-foreground" style={{marginLeft: (depth + 1) * 20}}>
              Loading…
            </p>
          ) : children && children.length > 0 ? (
            <>
              {children.map((child) => (
                <TicketTreeRow
                  key={child.id}
                  ticket={child}
                  depth={depth + 1}
                  projectsById={projectsById}
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                  onLoadChildren={onLoadChildren}
                  onOpenTicket={onOpenTicket}
                  getKnownChildren={getKnownChildren}
                  matchedIds={matchedIds}
                />
              ))}

              {!fullyLoaded && ticket.childCount > children.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  disableRipple
                  onClick={loadAllChildren}
                  disabled={loadingChildren}
                  className="self-start text-xs text-muted-foreground"
                  style={{marginLeft: (depth + 1) * 20}}
                >
                  {loadingChildren ? 'Loading…' : `Show all ${ticket.childCount} sub-tickets`}
                </Button>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground" style={{marginLeft: (depth + 1) * 20}}>
              No sub-tickets.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketTreeRow;
