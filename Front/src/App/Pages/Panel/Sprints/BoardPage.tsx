import {useCallback, useEffect, useMemo, useState} from 'react';
import {Play} from 'lucide-react';
import {PageContainer} from '@/components/ui/page-container';
import {Link, useParams} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {useSetModuleTitle} from '../ModuleTitle';
import useGetBoardHook from '@/lib/Board/useGetBoardHook';
import useListSprintsHook from '@/lib/Sprint/useListSprintsHook';
import useStartSprintHook from '@/lib/Sprint/useStartSprintHook';
import useGetProjectHook from '@/lib/Project/useGetProjectHook';
import useGetTicketHook from '@/lib/Ticket/useGetTicketHook';
import SprintVelocityChart, {type SprintVelocityPoint} from './SprintVelocityChart';
import type {Board} from '@/lib/Board/Type/types';
import type {Sprint} from '@/lib/Sprint/Type/types';
import type {Project} from '@/lib/Project/Type/types';
import type {Ticket} from '@/lib/Ticket/Type/types';

// The "Sprints" tab - reached via PrismMenu drilling into a board (Sprints /
// Settings, see menu.tsx), not an in-page tab switcher. "Add new sprint"
// lives in the PrismMenu footer for this board (menu.tsx), not on this page.
// Clicking a sprint's name opens its rail/timeline board (SprintBoardPage) -
// same page whatever the sprint's status.
const BoardPage = () => {
  const {boardId} = useParams<{boardId: string}>();
  const {getBoard} = useGetBoardHook();
  const {listSprints} = useListSprintsHook();
  const {startSprint} = useStartSprintHook();
  const {getProject} = useGetProjectHook();
  const {getTicket} = useGetTicketHook();
  const [board, setBoard] = useState<Board | null>(null);
  const [sprints, setSprints] = useState<Sprint[] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ticketsById, setTicketsById] = useState<Map<string, Ticket>>(new Map());
  const [pendingSprintId, setPendingSprintId] = useState<string | null>(null);

  useSetModuleTitle(board?.name ?? 'Board');

  const refetchSprints = useCallback(() => {
    if (!boardId) {
      return;
    }

    listSprints(boardId).then((result) => {
      if (result.success) {
        setSprints(result.sprints);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listSprints is a thin useRequestHook wrapper recreated every render
  }, [boardId]);

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

    listSprints(boardId).then((result) => {
      if (!cancelled && result.success) {
        setSprints(result.sprints);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getBoard/listSprints are thin useRequestHook wrappers recreated every render
  }, [boardId]);

  // Only needed to resolve each sprint ticket's isDone status below - same
  // pattern SprintBoardPage/SprintSummaryPage already use.
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

  // Every ticket referenced by any sprint on this board (minus closed
  // sprints' report-covered ones, below), deduped by id and
  // resolved ONCE (not per row) - getTicket is cache-backed, so this is
  // cheap after the first board visit. A ticket that fails to resolve just
  // stays out of the map (its sprint row's own tickets.length still counts
  // it - it only drops out of the done/left breakdown, same graceful
  // degradation useSprintRail already uses).
  useEffect(() => {
    if (!sprints) {
      return;
    }

    // A closed sprint's tickets are already answered by its report (see
    // ticketCountsBySprintId) - only fetch what still needs a live status.
    const refs = new Map<string, string>();
    sprints.forEach((sprint) => {
      const inReport = new Set(sprint.status === 'closed' ? sprint.report.map((entry) => entry.ticketId) : []);
      sprint.tickets.forEach(({ticketId, projectId}) => {
        if (!inReport.has(ticketId)) {
          refs.set(ticketId, projectId);
        }
      });
    });

    let cancelled = false;

    Promise.all(
      Array.from(refs.entries()).map(([ticketId, projectId]) => getTicket(projectId, ticketId)),
    ).then((results) => {
      if (!cancelled) {
        const map = new Map<string, Ticket>();
        results.forEach((result) => {
          if (result.success) {
            map.set(result.ticket.id, result.ticket);
          }
        });
        setTicketsById(map);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTicket is a thin useRequestHook wrapper recreated every render; ticket refs are joined below since arrays aren't referentially stable
  }, [sprints?.flatMap((sprint) => sprint.tickets.map((entry) => entry.ticketId)).join(',')]);

  const isDoneByStatusId = useMemo(() => {
    const map: Record<string, boolean> = {};
    projects.forEach((project) => project.statuses.forEach((status) => {
      map[status.id] = status.isDone;
    }));
    return map;
  }, [projects]);

  // Ticket count per sprint row. A closed sprint counts each ticket's
  // status AT CLOSE (its frozen `report[].statusId`, same as
  // SprintSummaryPage) - a ticket reopened afterwards still counts as done
  // for that sprint. Future/active sprints (and any ticket missing from the
  // report) use the live status.
  const ticketCountsBySprintId = useMemo(() => {
    const map = new Map<string, {total: number; done: number}>();

    (sprints ?? []).forEach((sprint) => {
      const closeStatusByTicketId = new Map(
        sprint.status === 'closed' ? sprint.report.map((entry) => [entry.ticketId, entry.statusId] as const) : [],
      );
      let done = 0;

      sprint.tickets.forEach(({ticketId}) => {
        const statusId = closeStatusByTicketId.get(ticketId) ?? ticketsById.get(ticketId)?.statusId;
        if (statusId && isDoneByStatusId[statusId]) {
          done += 1;
        }
      });

      map.set(sprint.id, {total: sprint.tickets.length, done});
    });

    return map;
  }, [sprints, ticketsById, isDoneByStatusId]);

  const closedSprintCount = useMemo(() => (sprints ?? []).filter((sprint) => sprint.status === 'closed').length, [sprints]);
  const activeSprint = useMemo(() => (sprints ?? []).find((sprint) => sprint.status === 'active') ?? null, [sprints]);

  // Active sprint's own committed/completed snapshot, per unit - already on
  // the sprint object (no extra request), same fields SprintSummaryPage's
  // stat tiles use.
  const activeUnitSummaries = useMemo(() => {
    if (!activeSprint) {
      return [];
    }

    const units = new Set<string>();
    activeSprint.initialEstimateUnit.forEach((entry) => units.add(entry.unit));
    activeSprint.actualEstimateUnit.forEach((entry) => units.add(entry.unit));

    return Array.from(units).map((unit) => ({
      unit,
      committed: activeSprint.initialEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0,
      completed: activeSprint.actualEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0,
    }));
  }, [activeSprint]);

  // Every closed sprint on this board, grouped per unit - same small
  // multiples convention as SprintSummaryPage/SprintComparePage (never one
  // combined axis across units, a board can span projects with different
  // estimateUnits).
  const velocityByUnit = useMemo(() => {
    const closedSprints = (sprints ?? [])
      .filter((sprint) => sprint.status === 'closed')
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    const byUnit = new Map<string, SprintVelocityPoint[]>();

    closedSprints.forEach((sprint) => {
      const units = new Set<string>();
      sprint.initialEstimateUnit.forEach((entry) => units.add(entry.unit));
      sprint.actualEstimateUnit.forEach((entry) => units.add(entry.unit));

      units.forEach((unit) => {
        const points = byUnit.get(unit) ?? [];
        points.push({
          id: sprint.id,
          name: sprint.name,
          committed: sprint.initialEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0,
          completed: sprint.actualEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0,
        });
        byUnit.set(unit, points);
      });
    });

    return Array.from(byUnit.entries());
  }, [sprints]);

  const handleStart = (sprintId: string) => {
    if (!boardId) {
      return;
    }

    setPendingSprintId(sprintId);
    startSprint(boardId, sprintId)
      .then((result) => {
        if (result.success) {
          refetchSprints();
        }
      })
      .finally(() => setPendingSprintId(null));
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Sprints</p>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/sprints/${boardId}/compare`}>Compare sprints</Link>
        </Button>
      </div>

      {sprints !== null && sprints.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Sprints</p>
              <p className="text-xl font-semibold text-foreground">{sprints.length}</p>
              <p className="text-xs text-muted-foreground">{closedSprintCount} closed</p>
            </div>

            {activeSprint &&
              activeUnitSummaries.map(({unit, committed, completed}) => (
                <div key={unit || '(no unit)'} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {activeSprint.name} · {unit || '(no unit)'}
                  </p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xl font-semibold text-foreground">{committed}</p>
                      <p className="text-xs text-muted-foreground">Committed</p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-accent">{completed}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {velocityByUnit.length > 0 && (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Velocity</p>
              {velocityByUnit.map(([unit, points]) => (
                <SprintVelocityChart key={unit || '(no unit)'} unit={unit} points={points} />
              ))}
            </div>
          )}
        </div>
      )}

      {sprints === null ? (
        <p className="text-sm text-muted-foreground">Loading sprints…</p>
      ) : sprints.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sprints yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sprints.map((sprint) => {
            const counts = ticketCountsBySprintId.get(sprint.id) ?? {total: 0, done: 0};
            const left = counts.total - counts.done;

            return (
            <div
              key={sprint.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3 text-sm text-foreground"
            >
              <div className="flex flex-col gap-1">
                <Link to={`/sprints/${boardId}/sprints/${sprint.id}`} className="hover:underline">
                  {sprint.name} · {sprint.status}
                </Link>

                <p className="text-xs text-muted-foreground">
                  {sprint.startDate} → {sprint.endDate}
                  {sprint.closedAt && ` · Closed ${sprint.closedAt.slice(0, 10)}`}
                  {' · '}
                  {counts.total} ticket{counts.total === 1 ? '' : 's'}
                  {counts.total > 0 && ` · ${counts.done} done · ${left} left`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {sprint.status === 'future' && (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/sprints/${boardId}/sprints/${sprint.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Play className="h-4 w-4" />}
                      loading={pendingSprintId === sprint.id}
                      onClick={() => handleStart(sprint.id)}
                    >
                      Start
                    </Button>
                  </>
                )}

                <Button variant="outline" size="sm" asChild>
                  {/* Same page whatever the status - active sprints get the
                      "Close sprint" action there too (closing is no longer a
                      single click here), closed/future ones are read-only. */}
                  <Link to={`/sprints/${boardId}/sprints/${sprint.id}/summary`}>View summary</Link>
                </Button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default BoardPage;
