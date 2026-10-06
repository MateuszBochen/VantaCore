import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {PageContainer} from '@/components/ui/page-container';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, Check} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {UNASSIGNED_USER_ID} from '@/components/ui/user-avatar-stack';
import {useSetModuleTitle} from '../ModuleTitle';
import useGetBoardHook from '@/lib/Board/useGetBoardHook';
import useListSprintsHook from '@/lib/Sprint/useListSprintsHook';
import useCloseSprintHook from '@/lib/Sprint/useCloseSprintHook';
import useGetSprintReportHook from '@/lib/Sprint/useGetSprintReportHook';
import useGetProjectHook from '@/lib/Project/useGetProjectHook';
import useUsersHook from '@/lib/User/useUsersHook';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import {eventBus} from '@/lib/EventBus/EventBus';
import {TicketWasChangedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasChangedRemoteEvent';
import {TicketWasDeletedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasDeletedRemoteEvent';
import useSprintRail, {type SprintRail} from './useSprintRail';
import SprintAssigneeChart, {type SprintAssigneePoint} from './SprintAssigneeChart';
import SprintBurndownChart from './SprintBurndownChart';
import TicketPopup, {type TicketPopupHandle} from '../Project/Tickets/TicketPopup';
import type {Board} from '@/lib/Board/Type/types';
import type {Sprint, SprintReport} from '@/lib/Sprint/Type/types';
import type {Project} from '@/lib/Project/Type/types';
import type {Ticket} from '@/lib/Ticket/Type/types';

// Every ticket actually "in" this sprint (rail.selected, not rootTicket/path
// - those are ancestor context, not necessarily sprint members themselves),
// deduped by id the same way SprintBoardPage's own railTickets does.
const sprintTickets = (rails: SprintRail[]): Ticket[] => {
  const byId = new Map<string, Ticket>();
  rails.forEach((rail) => rail.selected.forEach((entry) => byId.set(entry.ticket.id, entry.ticket)));
  return Array.from(byId.values());
};

type UnitSummary = {
  unit: string;
  committed: number;
  closingScope: number;
  completed: number;
};

type BurnRateSummary = {
  unit: string;
  averagePerDay: number;
  elapsedDays: number;
  remaining: number;
};

const daysBetween = (start: string, end: string): number =>
  Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));

// Reached from BoardPage's "View summary" (active sprints) - review what got
// done, what's left, and velocity before actually closing. "Close sprint"
// lives here now, not on BoardPage's list anymore.
const SprintSummaryPage = () => {
  const {boardId, sprintId} = useParams<{boardId: string; sprintId: string}>();
  const navigate = useNavigate();
  const {getBoard} = useGetBoardHook();
  const {listSprints} = useListSprintsHook();
  const {closeSprint} = useCloseSprintHook();
  const {getSprintReport} = useGetSprintReportHook();
  const {getProject} = useGetProjectHook();
  const {users} = useUsersHook();
  const ticketPopupRef = useRef<TicketPopupHandle>(null);
  const handleOpenTicket = (ticket: Ticket) => ticketPopupRef.current?.open(ticket.projectId, ticket.id, ticket.key);

  const [board, setBoard] = useState<Board | null>(null);
  const [allSprints, setAllSprints] = useState<Sprint[] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [report, setReport] = useState<SprintReport | null>(null);
  const [closing, setClosing] = useState(false);
  // Bumped on a ticket changed/deleted elsewhere - unlike the ticket LIST
  // (which useSprintRail already keeps live on its own), the numbers here
  // (actualEstimateUnit, burndown, burn rate, transition counts) are
  // server-computed snapshots on Sprint/SprintReport, fetched once on mount.
  // No point matching the event's ticketId against sprint.tickets first -
  // both refetches below are cheap single requests, and a false-positive
  // refetch (a ticket outside this sprint changed) is harmless.
  const [reportReloadToken, setReportReloadToken] = useState(0);

  const sprint = allSprints?.find((candidate) => candidate.id === sprintId) ?? null;

  useSetModuleTitle(sprint ? `${sprint.name} — Summary` : 'Sprint summary');

  useEffect(() => {
    if (!boardId) {
      return;
    }

    let cancelled = false;

    getBoard(boardId).then((result) => {
      if (!cancelled && result.success) {
        setBoard(result.board);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getBoard is a thin useRequestHook wrapper recreated every render
  }, [boardId]);

  // The full list, not just this sprint - also feeds the velocity chart
  // across every closed sprint on the board.
  useEffect(() => {
    if (!boardId) {
      return;
    }

    let cancelled = false;

    listSprints(boardId).then((result) => {
      if (!cancelled && result.success) {
        setAllSprints(result.sprints);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listSprints is a thin useRequestHook wrapper recreated every render
  }, [boardId, reportReloadToken]);

  // ticketStatusTransitions confirmed 2026-08-11; burndownByUnit PROPOSED,
  // folded into this same response (see useGetSprintReportHook/SprintReport's
  // own comments) - any failure still resolves to an empty report rather
  // than an error, so the transition-count column and the burndown's actual
  // line just don't render instead of erroring the whole page over
  // non-critical metrics.
  useEffect(() => {
    if (!boardId || !sprintId) {
      return;
    }

    let cancelled = false;

    getSprintReport(boardId, sprintId).then((result) => {
      if (!cancelled) {
        setReport(result.success ? result.report : {sprintId, ticketStatusTransitions: [], burndownByUnit: []});
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getSprintReport is a thin useRequestHook wrapper recreated every render
  }, [boardId, sprintId, reportReloadToken]);

  // Someone else's edit or delete can move Completed/burndown/burn-rate out
  // from under this page - useSprintRail's own subscriptions already keep
  // the ticket LIST (completedTickets/incompleteTickets, hence the assignee
  // chart too) live, but actualEstimateUnit/burndown/transition counts are
  // separate server snapshots this page fetched once on mount, so they need
  // their own refetch trigger.
  useEffect(() => {
    const handleRemoteTicketMutation = () => setReportReloadToken((token) => token + 1);

    eventBus.subscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleRemoteTicketMutation);
    eventBus.subscribe<TicketWasDeletedRemoteEvent>(TicketWasDeletedRemoteEvent.name, handleRemoteTicketMutation);

    return () => {
      eventBus.unsubscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleRemoteTicketMutation);
      eventBus.unsubscribe<TicketWasDeletedRemoteEvent>(TicketWasDeletedRemoteEvent.name, handleRemoteTicketMutation);
    };
  }, []);

  // Only needed to resolve isDone/estimateUnit per project - same pattern
  // SprintBoardPage already uses.
  useEffect(() => {
    if (!board) {
      return;
    }

    let cancelled = false;

    Promise.all(board.projectIds.map((id) => getProject(id))).then((results) => {
      if (!cancelled) {
        setProjects(results.flatMap((result) => (result.success ? [result.project] : [])));
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getProject is a thin useRequestHook wrapper recreated every render; projectIds is joined below since arrays aren't referentially stable
  }, [board?.projectIds.join(',')]);

  const {rails} = useSprintRail(board, sprint);

  const isDoneByStatusId = useMemo(() => {
    const map: Record<string, boolean> = {};
    projects.forEach((project) => project.statuses.forEach((status) => {
      map[status.id] = status.isDone;
    }));
    return map;
  }, [projects]);

  const estimateUnitByProjectId = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((project) => {
      map[project.id] = project.estimateUnit;
    });
    return map;
  }, [projects]);

  const transitionCountByTicketId = useMemo(() => {
    const map: Record<string, number> = {};
    (report?.ticketStatusTransitions ?? []).forEach((entry) => {
      map[entry.ticketId] = entry.count;
    });
    return map;
  }, [report]);

  // A closed sprint is judged by each ticket's status AT CLOSE (the
  // server's frozen report[].statusId), not today's - a ticket reopened
  // after the sprint ended still counts as completed here, matching
  // actualEstimateUnit. Live status for active sprints, and for any ticket
  // missing from the report.
  const closeStatusByTicketId = useMemo(() => {
    const map: Record<string, string> = {};
    if (sprint?.status === 'closed') {
      sprint.report.forEach((entry) => {
        map[entry.ticketId] = entry.statusId;
      });
    }
    return map;
  }, [sprint]);

  const tickets = useMemo(() => (rails ? sprintTickets(rails) : []), [rails]);
  const isTicketDone = useCallback(
    (ticket: Ticket): boolean => isDoneByStatusId[closeStatusByTicketId[ticket.id] ?? ticket.statusId] ?? false,
    [isDoneByStatusId, closeStatusByTicketId],
  );
  const completedTickets = useMemo(() => tickets.filter(isTicketDone), [tickets, isTicketDone]);
  const incompleteTickets = useMemo(() => tickets.filter((ticket) => !isTicketDone(ticket)), [tickets, isTicketDone]);

  // Committed/closing scope can ONLY come from the sprint's own
  // server-computed snapshot - there's no way to derive "what was committed
  // at sprint start" from CURRENT ticket data once scope has changed
  // mid-sprint. Completed prefers that same snapshot too, but falls back to
  // a live count from currently-done tickets for a still-active sprint
  // (actualEstimateUnit may only be finalized at close).
  const unitSummaries = useMemo<UnitSummary[]>(() => {
    if (!sprint) {
      return [];
    }

    const units = new Set<string>();
    sprint.initialEstimateUnit.forEach((entry) => units.add(entry.unit));
    sprint.closingEstimateUnit.forEach((entry) => units.add(entry.unit));
    sprint.actualEstimateUnit.forEach((entry) => units.add(entry.unit));
    completedTickets.forEach((ticket) => units.add(estimateUnitByProjectId[ticket.projectId] ?? ''));

    const liveCompletedByUnit: Record<string, number> = {};
    completedTickets.forEach((ticket) => {
      if (ticket.estimate === null) {
        return;
      }
      const unit = estimateUnitByProjectId[ticket.projectId] ?? '';
      liveCompletedByUnit[unit] = (liveCompletedByUnit[unit] ?? 0) + ticket.estimate;
    });

    return Array.from(units).map((unit) => ({
      unit,
      committed: sprint.initialEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0,
      closingScope: sprint.closingEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0,
      completed: sprint.actualEstimateUnit.find((entry) => entry.unit === unit)?.value ?? liveCompletedByUnit[unit] ?? 0,
    }));
  }, [sprint, completedTickets, estimateUnitByProjectId]);

  // Pairs each unit's committed total (the ideal line's starting point,
  // computable client-side) with whatever actual daily points the report
  // endpoint returned for it (possibly none yet).
  const burndownByUnit = useMemo(
    () =>
      unitSummaries.map((summary) => ({
        unit: summary.unit,
        committed: summary.committed,
        actualPoints: report?.burndownByUnit.find((entry) => entry.unit === summary.unit)?.points ?? [],
      })),
    [unitSummaries, report],
  );

  // A ticket with multiple assignees counts toward each of them (same
  // "shared credit" convention SprintFilterBar/UserAvatarStack already use
  // for multi-assignee tickets), grouped under UNASSIGNED_USER_ID when it
  // has none.
  const assigneeStats = useMemo(() => {
    const map = new Map<string, {completed: number; incomplete: number}>();

    const ensure = (userId: string) => {
      if (!map.has(userId)) {
        map.set(userId, {completed: 0, incomplete: 0});
      }
      return map.get(userId)!;
    };

    completedTickets.forEach((ticket) => {
      const assignees = ticket.assigneeIds.length > 0 ? ticket.assigneeIds : [UNASSIGNED_USER_ID];
      assignees.forEach((userId) => {
        ensure(userId).completed += 1;
      });
    });

    incompleteTickets.forEach((ticket) => {
      const assignees = ticket.assigneeIds.length > 0 ? ticket.assigneeIds : [UNASSIGNED_USER_ID];
      assignees.forEach((userId) => {
        ensure(userId).incomplete += 1;
      });
    });

    return Array.from(map.entries())
      .map(([userId, stats]) => ({userId, ...stats}))
      .sort((a, b) => b.completed - a.completed);
  }, [completedTickets, incompleteTickets]);

  // Every assignee gets their own done-vs-left bar (stacked, not a separate
  // text list duplicating the same numbers) - includes people with zero
  // completed tickets too, as long as they have something in the sprint.
  const assigneeChartPoints = useMemo<SprintAssigneePoint[]>(
    () =>
      assigneeStats.map((entry) => {
        if (entry.userId === UNASSIGNED_USER_ID) {
          return {id: entry.userId, name: 'Unassigned', completed: entry.completed, incomplete: entry.incomplete};
        }

        const user = users.find((candidate) => candidate.id === entry.userId);
        return {
          id: entry.userId,
          name: user ? getUserDisplayName(user) : 'Unknown user',
          completed: entry.completed,
          incomplete: entry.incomplete,
        };
      }),
    [assigneeStats, users],
  );

  // Average daily burn for THIS sprint, per unit - how much of committed
  // scope actually got done per elapsed day so far, not a cross-sprint
  // comparison (that lives on SprintComparePage instead). Derived from the
  // same burndown actualPoints already fetched for the chart above, so no
  // extra request.
  const burnRateByUnit = useMemo<BurnRateSummary[]>(() => {
    if (!sprint) {
      return [];
    }

    return burndownByUnit.flatMap(({unit, committed, actualPoints}) => {
      if (actualPoints.length === 0) {
        return [];
      }

      const latest = actualPoints.reduce((a, b) => (a.date > b.date ? a : b));
      const elapsedDays = Math.max(1, daysBetween(sprint.startDate, latest.date));
      const burned = committed - latest.remaining;

      return [{unit, averagePerDay: burned / elapsedDays, elapsedDays, remaining: latest.remaining}];
    });
  }, [burndownByUnit, sprint]);

  const handleClose = useCallback(() => {
    if (!boardId || !sprintId) {
      return;
    }

    setClosing(true);

    closeSprint(boardId, sprintId)
      .then((result) => {
        if (result.success) {
          navigate(`/sprints/${boardId}`, {replace: true});
        }
      })
      .finally(() => setClosing(false));
  }, [boardId, sprintId, closeSprint, navigate]);

  if (allSprints && !sprint) {
    return <p className="p-8 text-sm text-muted-foreground">This sprint doesn't exist.</p>;
  }

  if (!board || !sprint) {
    return <p className="p-8 text-sm text-muted-foreground">Loading sprint…</p>;
  }

  return (
    <PageContainer>
      <Link to={`/sprints/${boardId}`} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {board.name}
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{sprint.name} — Summary</p>
          <p className="text-xs text-muted-foreground">
            {sprint.startDate} → {sprint.endDate} · {sprint.status}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link to={`/sprints/${boardId}/sprints/${sprintId}`}>Sprint board</Link>
          </Button>

          {sprint.status === 'active' && (
            <Button size="sm" leftIcon={<Check className="h-4 w-4" />} loading={closing} onClick={handleClose}>
              Close sprint
            </Button>
          )}
        </div>
      </div>

      {unitSummaries.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {unitSummaries.map(({unit, committed, closingScope, completed}) => (
            <div key={unit || '(no unit)'} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{unit || '(no unit)'}</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-xl font-semibold text-foreground">{committed}</p>
                  <p className="text-xs text-muted-foreground">Committed</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-accent">{completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">{closingScope}</p>
                  <p className="text-xs text-muted-foreground">Closing scope</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        {sprint.status === 'future' ? (
          <>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Burndown</p>
            {/* initialEstimateUnit (the ideal line's committed baseline) is only
                set by the backend once a sprint starts, so before that the line
                would just draw flat at 0 - misleading rather than informative. */}
            <p className="text-sm text-muted-foreground">Burndown becomes available once the sprint starts.</p>
          </>
        ) : burndownByUnit.length === 0 ? (
          <>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Burndown</p>
            <p className="text-sm text-muted-foreground">No estimate data on this sprint yet.</p>
          </>
        ) : (
          burndownByUnit.map(({unit, committed, actualPoints}) => (
            <SprintBurndownChart
              key={unit || '(no unit)'}
              unit={unit}
              startDate={sprint.startDate}
              endDate={sprint.endDate}
              committed={committed}
              actualPoints={actualPoints}
            />
          ))
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Burn rate</p>

        {burnRateByUnit.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough data yet — burn rate appears once actual progress is recorded.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {burnRateByUnit.map(({unit, averagePerDay, elapsedDays, remaining}) => (
              <div key={unit || '(no unit)'} className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{unit || '(no unit)'}</p>
                <p className="text-xl font-semibold text-accent">
                  {averagePerDay.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/ day</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {remaining} remaining · {elapsedDays} day{elapsedDays === 1 ? '' : 's'} in
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Completed ({completedTickets.length})</p>

          {completedTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing completed yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {completedTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => handleOpenTicket(ticket)}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2 text-left text-sm hover:bg-card"
                >
                  <span className="min-w-0 truncate text-foreground">
                    <span className="text-muted-foreground">{ticket.key}</span> {ticket.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    {ticket.estimate ?? '—'}
                    {transitionCountByTicketId[ticket.id] !== undefined && (
                      <span title="Status changes during this sprint">· {transitionCountByTicketId[ticket.id]}×</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Not completed ({incompleteTickets.length})</p>

          {incompleteTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Everything got done.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {incompleteTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => handleOpenTicket(ticket)}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2 text-left text-sm hover:bg-card"
                >
                  <span className="min-w-0 truncate text-foreground">
                    <span className="text-muted-foreground">{ticket.key}</span> {ticket.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    {ticket.estimate ?? '—'}
                    {transitionCountByTicketId[ticket.id] !== undefined && (
                      <span title="Status changes during this sprint">· {transitionCountByTicketId[ticket.id]}×</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">By assignee</p>

        <SprintAssigneeChart points={assigneeChartPoints} />
      </div>

      <TicketPopup ref={ticketPopupRef} />
    </PageContainer>
  );
};

export default SprintSummaryPage;
