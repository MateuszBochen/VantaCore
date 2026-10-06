import {useEffect, useMemo, useRef, type MouseEvent} from 'react';
import {Link} from 'react-router-dom';
import {History, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import useGetTicketHook from '@/lib/Ticket/useGetTicketHook';
import toTicketSummary from '@/lib/Ticket/toTicketSummary';
import type {Project} from '@/lib/Project/Type/types';
import type {TicketSummary} from '@/lib/Ticket/Type/types';
import type {SprintTicketRef} from '@/lib/Sprint/Type/types';

type SprintSelectedTicketsProps = {
  // Fixed height in px (SprintFormPage passes the calendar's) - the list
  // scrolls inside instead of growing the panel. null until measured.
  height: number | null;
  tickets: SprintTicketRef[];
  // Shared with SprintTicketPicker via SprintFormPage - whatever either one
  // has already loaded. Anything selected but not in here yet (an existing
  // sprint's tickets on edit, carried-over ones) is fetched below.
  knownTickets: Record<string, TicketSummary>;
  onTicketsLoaded: (tickets: TicketSummary[]) => void;
  projects: Project[];
  onRemove: (ticketId: string) => void;
  onOpenTicket: (ticket: TicketSummary) => void;
  // Ids added from the previous sprint (badge only).
  carriedOverIds: Set<string>;
  // Unfinished tickets of the previous sprint that aren't selected (yet) -
  // offered as a one-click "add them" (always on edit, and on create once
  // some of the auto-added ones were removed again).
  carryOver: {sprintName: string; count: number; onAdd: () => void} | null;
};

// The right-hand "what's in this sprint" list on SprintFormPage, next to the
// date calendar. Owns the estimate summary that used to sit above the
// picker: sums each selected ticket's own `estimate` (never `estimateAll` -
// the hierarchy rollup would double-count a parent on top of its own
// selected children), grouped by the owning project's estimateUnit since a
// board can link projects with different units and "3h" + "5 SP" isn't
// meaningful.
const SprintSelectedTickets = ({
  height,
  tickets,
  knownTickets,
  onTicketsLoaded,
  projects,
  onRemove,
  onOpenTicket,
  carriedOverIds,
  carryOver,
}: SprintSelectedTicketsProps) => {
  const {getTicket} = useGetTicketHook();
  // Ids already requested, so a re-render while a fetch is in flight (or a
  // ticket that failed to load) doesn't fire it again.
  const requestedIds = useRef(new Set<string>());

  const missingKey = tickets
    .filter(({ticketId}) => !knownTickets[ticketId])
    .map(({ticketId, projectId}) => `${projectId}:${ticketId}`)
    .join(',');

  useEffect(() => {
    const refs = (missingKey ? missingKey.split(',') : [])
      .map((entry) => {
        const [projectId, ticketId] = entry.split(':');
        return {projectId, ticketId};
      })
      .filter(({ticketId}) => !requestedIds.current.has(ticketId));

    if (refs.length === 0) {
      return;
    }

    refs.forEach(({ticketId}) => requestedIds.current.add(ticketId));

    Promise.all(refs.map(({projectId, ticketId}) => getTicket(projectId, ticketId))).then((results) => {
      onTicketsLoaded(results.flatMap((result) => (result.success ? [toTicketSummary(result.ticket)] : [])));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTicket/onTicketsLoaded are recreated every render; missingKey is the actual trigger
  }, [missingKey]);

  const projectsById = useMemo(() => Object.fromEntries(projects.map((project) => [project.id, project])), [projects]);

  const {sumsByUnit, unestimatedCount} = useMemo(() => {
    const sums: Record<string, number> = {};
    let missing = 0;

    tickets.forEach(({ticketId}) => {
      const ticket = knownTickets[ticketId];

      if (!ticket) {
        return;
      }

      if (ticket.estimate === null) {
        missing += 1;
        return;
      }

      const unit = projectsById[ticket.projectId]?.estimateUnit || '(no unit)';
      sums[unit] = (sums[unit] ?? 0) + ticket.estimate;
    });

    return {sumsByUnit: sums, unestimatedCount: missing};
  }, [tickets, knownTickets, projectsById]);

  const handleOpenClick = (event: MouseEvent<HTMLAnchorElement>, ticket: TicketSummary) => {
    // Plain click = popup (the form's draft stays put); modifier/middle
    // clicks fall through to the real href (new tab).
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      onOpenTicket(ticket);
    }
  };

  return (
    <div className="flex min-w-72 flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4" style={height !== null ? {height} : undefined}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-foreground">
          {tickets.length} ticket{tickets.length === 1 ? '' : 's'} selected
        </span>

        {Object.entries(sumsByUnit).map(([unit, sum]) => (
          <span key={unit} className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-accent">
            {sum} {unit}
          </span>
        ))}

        {unestimatedCount > 0 && (
          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs text-amber-300">
            {unestimatedCount} without an estimate
          </span>
        )}
      </div>

      {carryOver && carryOver.count > 0 && (
        <Button variant="outline" size="sm" leftIcon={<History className="h-4 w-4" />} onClick={carryOver.onAdd} className="w-fit">
          Add {carryOver.count} unfinished from {carryOver.sprintName}
        </Button>
      )}

      {tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets yet - pick them from the search below.</p>
      ) : (
        <div className="-mr-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-2">
          {tickets.map(({ticketId}) => {
            const ticket = knownTickets[ticketId];
            const project = ticket ? projectsById[ticket.projectId] : undefined;
            const status = project?.statuses.find((candidate) => candidate.id === ticket?.statusId);

            return (
              <div key={ticketId} className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5">
                {ticket ? (
                  <>
                    <Link
                      to={`/projects/${ticket.projectId}/tickets/${ticket.id}`}
                      onClick={(event) => handleOpenClick(event, ticket)}
                      className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-accent hover:underline"
                    >
                      {ticket.key}
                    </Link>

                    <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={ticket.title}>
                      {ticket.title}
                    </span>

                    {carriedOverIds.has(ticketId) && (
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground" title="Unfinished in the previous sprint">
                        carried over
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

                    <span className="w-6 shrink-0 text-right text-xs text-muted-foreground" title="Estimate">
                      {ticket.estimate ?? '—'}
                    </span>
                  </>
                ) : (
                  <span className="min-w-0 flex-1 text-xs text-muted-foreground">Loading…</span>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  disableRipple
                  onClick={() => onRemove(ticketId)}
                  title="Remove from sprint"
                  className="h-5 w-5 min-w-0 shrink-0 rounded-md p-0 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SprintSelectedTickets;
