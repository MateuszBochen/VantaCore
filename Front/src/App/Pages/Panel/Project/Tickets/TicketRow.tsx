import {memo, useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ChevronDown, ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import type {Flag, IssueType, Status} from '@/lib/Project/Type/types';
import {PRIORITIES} from '@/lib/Ticket/Type/types';
import type {TicketSummary} from '@/lib/Ticket/Type/types';
import useGetTicketsHook from '@/lib/Ticket/useGetTicketsHook';
import applyTicketChangedPayload from '@/lib/Ticket/applyTicketChangedPayload';
import applyTicketDeletedPayload from '@/lib/Ticket/applyTicketDeletedPayload';
import {eventBus} from '@/lib/EventBus/EventBus';
import {TicketWasChangedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasChangedRemoteEvent';
import {TicketWasDeletedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasDeletedRemoteEvent';

type TicketRowProps = {
  projectId: string;
  ticket: TicketSummary;
  issueTypes: IssueType[];
  // Project-level shared pool (see the Status & Workflow Model sub-project) -
  // issue types no longer own their own status objects.
  statuses: Status[];
  // Project.flags catalog - ticket.flagIds are resolved against it for the
  // flag pills (same resolution as the sprint board's TicketIsland).
  flags: Flag[];
  depth: number;
  // Both omitted (not just false/no-op) by every caller that doesn't need
  // bulk selection (ReleaseCard, TicketChildrenSection, MyTicketsPage) - the
  // checkbox only renders when onToggleSelect is actually given, so those
  // callers' rows are pixel-identical to before this existed.
  selectedIds?: Set<string>;
  onToggleSelect?: (ticketId: string) => void;
};

// Recursive - a ticket's children are TicketRows themselves, fetched lazily
// on first expand so opening the list doesn't need to eagerly walk the
// whole tree (hierarchy depth is unbounded, see IssueType.childTypeIds).
// Wrapped in memo: applyTicketChangedPayload (TicketsPage/TicketChildrenSection)
// patches one matching entry and keeps every OTHER entry's object reference
// untouched, so a single ticket's remote update only re-renders that one
// row instead of the whole visible list.
const TicketRow = memo(({projectId, ticket, issueTypes, statuses, flags, depth, selectedIds, onToggleSelect}: TicketRowProps) => {
  const {getTickets} = useGetTicketsHook();
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<TicketSummary[] | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(false);

  const issueType = issueTypes.find((type) => type.id === ticket.issueTypeId) ?? null;
  const status = statuses.find((candidate) => candidate.id === ticket.statusId) ?? null;
  const priority = PRIORITIES.find((candidate) => candidate.level === ticket.priority) ?? null;
  const ticketFlags = flags.filter((flag) => ticket.flagIds.includes(flag.id));

  const handleToggle = useCallback(() => {
    setExpanded((current) => !current);

    if (children !== null) {
      return;
    }

    setLoadingChildren(true);
    getTickets(projectId, ticket.id).then((result) => {
      setLoadingChildren(false);

      if (result.success) {
        setChildren(result.tickets);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTickets is a thin useRequestHook wrapper recreated every render; `children !== null` above already guards against refetching
  }, [children, projectId, ticket.id]);

  // Patches a matching entry in this row's own already-loaded children -
  // TicketsPage does the same for the root list, each row only ever owns
  // its one level.
  useEffect(() => {
    const handleTicketChangedRemotely = (remoteEvent: TicketWasChangedRemoteEvent) => {
      setChildren((current) => (current ? applyTicketChangedPayload(current, remoteEvent.payload) : current));
    };

    eventBus.subscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);
    };
  }, []);

  // Same idea, for a child deleted elsewhere.
  useEffect(() => {
    const handleTicketDeletedRemotely = (remoteEvent: TicketWasDeletedRemoteEvent) => {
      setChildren((current) => (current ? applyTicketDeletedPayload(current, remoteEvent.payload) : current));
    };

    eventBus.subscribe<TicketWasDeletedRemoteEvent>(TicketWasDeletedRemoteEvent.name, handleTicketDeletedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasDeletedRemoteEvent>(TicketWasDeletedRemoteEvent.name, handleTicketDeletedRemotely);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.03] p-3"
        style={{marginLeft: depth * 24}}
      >
        {onToggleSelect && (
          <Checkbox checked={selectedIds?.has(ticket.id) ?? false} onCheckedChange={() => onToggleSelect(ticket.id)} />
        )}

        {ticket.childCount > 0 ? (
          <Button
            variant="ghost"
            size="icon"
            disableRipple
            onClick={handleToggle}
            className="h-6 w-6 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : (
          // Leaf ticket - no expander, just a same-sized spacer so the key/
          // title column still lines up with sibling rows that have one.
          <span className="h-6 w-6 shrink-0" />
        )}

        {priority && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{backgroundColor: priority.color}}
            title={`Priority: ${priority.name}`}
          />
        )}

        <Link
          to={`/projects/${projectId}/tickets/${ticket.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80"
        >
          <span className="shrink-0 text-xs text-muted-foreground">{ticket.key}</span>

          {issueType && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{backgroundColor: `${issueType.color}33`, color: issueType.color}}
            >
              {issueType.name}
            </span>
          )}

          <span className="min-w-0 flex-1 truncate font-medium text-foreground">{ticket.title}</span>
        </Link>

        {ticketFlags.map((flag) => (
          <span
            key={flag.id}
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{backgroundColor: `${flag.color}33`, color: flag.color}}
          >
            {flag.name}
          </span>
        ))}

        {status && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{backgroundColor: `${status.color}33`, color: status.color}}
          >
            {status.name}
          </span>
        )}

        {ticket.progress !== null && (
          <div className="flex shrink-0 items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-cyan-400" style={{width: `${ticket.progress}%`}} />
            </div>
            <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">{ticket.progress}%</span>
          </div>
        )}

        <span className="shrink-0 text-xs text-muted-foreground" title="Total time logged">
          {Math.floor(ticket.timeSpentAll / 60)}h {ticket.timeSpentAll % 60}m
        </span>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2">
          {loadingChildren ? (
            <p className="text-xs text-muted-foreground" style={{marginLeft: (depth + 1) * 24}}>
              Loading…
            </p>
          ) : children && children.length > 0 ? (
            children.map((child) => (
              <TicketRow
                key={child.id}
                projectId={projectId}
                ticket={child}
                issueTypes={issueTypes}
                statuses={statuses}
                flags={flags}
                depth={depth + 1}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground" style={{marginLeft: (depth + 1) * 24}}>
              No sub-tickets.
            </p>
          )}
        </div>
      )}
    </div>
  );
});

TicketRow.displayName = 'TicketRow';

export default TicketRow;
