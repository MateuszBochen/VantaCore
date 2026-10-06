import {useEffect, useMemo, useState} from 'react';
import {PageContainer} from '@/components/ui/page-container';
import {Link} from 'react-router-dom';
import {useSetModuleTitle} from '../ModuleTitle';
import {useSetBreadcrumb} from '../Breadcrumb';
import useListProjectsHook from '@/lib/Project/useListProjectsHook';
import useListBoardsHook from '@/lib/Board/useListBoardsHook';
import useListSprintsHook from '@/lib/Sprint/useListSprintsHook';
import useMyTicketsHook from '@/lib/Ticket/useMyTicketsHook';
import MyWorklogWidget from './MyWorklogWidget';
import RoadmapWidget from './RoadmapWidget';
import type {ProjectSummary} from '@/lib/Project/Type/types';
import type {BoardSummary} from '@/lib/Board/Type/types';
import type {Sprint} from '@/lib/Sprint/Type/types';

const MY_TICKETS_PREVIEW_LIMIT = 5;

type ActiveSprintEntry = {
  board: BoardSummary;
  sprint: Sprint;
  unitSummaries: {unit: string; committed: number; completed: number}[];
};

// Active sprint's own committed/completed snapshot, per unit - already on
// the sprint object (no ticket fetch needed), same fields BoardsListPage's
// own per-board active-sprint cards use.
const buildUnitSummaries = (sprint: Sprint) => {
  const units = new Set<string>();
  sprint.initialEstimateUnit.forEach((entry) => units.add(entry.unit));
  sprint.actualEstimateUnit.forEach((entry) => units.add(entry.unit));

  return Array.from(units).map((unit) => ({
    unit,
    committed: sprint.initialEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0,
    completed: sprint.actualEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0,
  }));
};

// The "/" landing page - previously a bare "Workplace" placeholder
// (WorkPlace.tsx's catch-all route). See memory:
// project_vantacore_gap_audit_2026-08-11 - originally deliberately light,
// extended with a "My tickets" preview + active-sprint stats once that felt
// too empty (item 2's BoardsListPage stats/item 6's MyTicketsPage already
// existed - this just surfaces a slice of both here too).
const DashboardPage = () => {
  const {listProjects} = useListProjectsHook();
  const {listBoards} = useListBoardsHook();
  const {listSprints} = useListSprintsHook();
  const {myTicketGroups} = useMyTicketsHook();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [activeSprints, setActiveSprints] = useState<ActiveSprintEntry[] | null>(null);

  useSetModuleTitle('Dashboard');
  // Not in the PrismMenu tree (it's the root landing page, not a drill-down
  // target) - same reasoning as ProfilePage's own useSetBreadcrumb.
  useSetBreadcrumb([{label: 'Dashboard', link: null}]);

  useEffect(() => {
    let cancelled = false;

    listProjects().then((result) => {
      if (!cancelled && result.success) {
        setProjects(result.projects);
      }
    });

    listBoards().then((result) => {
      if (!cancelled && result.success) {
        setBoards(result.boards);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listProjects/listBoards are thin useRequestHook wrappers recreated every render
  }, []);

  // One sprint list per board, kept only if it has an active sprint - same
  // N-requests-but-cheap pattern BoardsListPage uses for its own per-board
  // stats.
  useEffect(() => {
    if (!boards) {
      return;
    }

    let cancelled = false;

    Promise.all(
      boards.map((board) => listSprints(board.id).then((result) => ({board, result}))),
    ).then((entries) => {
      if (cancelled) {
        return;
      }

      const active = entries.flatMap(({board, result}) => {
        if (!result.success) {
          return [];
        }

        const sprint = result.sprints.find((candidate) => candidate.status === 'active');
        return sprint ? [{board, sprint, unitSummaries: buildUnitSummaries(sprint)}] : [];
      });

      setActiveSprints(active);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listSprints is a thin useRequestHook wrapper recreated every render; boards is joined below since arrays aren't referentially stable
  }, [boards?.map((board) => board.id).join(',')]);

  const myTicketsPreview = useMemo(
    () => (myTicketGroups ?? []).flatMap((group) => group.tickets.map((ticket) => ({project: group.project, ticket}))),
    [myTicketGroups],
  );

  return (
    <PageContainer>
      <p className="text-sm font-semibold text-foreground">Dashboard</p>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Projects</p>
          <p className="text-xl font-semibold text-foreground">{projects === null ? '—' : projects.length}</p>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Boards</p>
          <p className="text-xl font-semibold text-foreground">{boards === null ? '—' : boards.length}</p>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">My tickets</p>
          <p className="text-xl font-semibold text-foreground">{myTicketGroups === null ? '—' : myTicketsPreview.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">My tickets</p>
            <Link to="/my-tickets" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>

          {myTicketGroups === null ? (
            <p className="text-sm text-muted-foreground">Loading tickets…</p>
          ) : myTicketsPreview.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing assigned to you.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {myTicketsPreview.slice(0, MY_TICKETS_PREVIEW_LIMIT).map(({project, ticket}) => (
                <Link
                  key={ticket.id}
                  to={`/projects/${project.id}/tickets/${ticket.id}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm text-foreground hover:opacity-80"
                >
                  <span className="min-w-0 truncate">
                    <span className="text-muted-foreground">{ticket.key}</span> {ticket.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{project.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Active sprints</p>

          {activeSprints === null ? (
            <p className="text-sm text-muted-foreground">Loading sprints…</p>
          ) : activeSprints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sprints right now.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {activeSprints.map(({board, sprint, unitSummaries}) => (
                <Link
                  key={sprint.id}
                  to={`/sprints/${board.id}/sprints/${sprint.id}`}
                  className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3 hover:opacity-80"
                >
                  <span className="text-sm text-foreground">
                    {board.name} · {sprint.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {sprint.startDate} → {sprint.endDate}
                    {unitSummaries.map(({unit, committed, completed}) => (
                      <span key={unit || '(no unit)'}>
                        {' '}
                        · {completed}/{committed} {unit || '(no unit)'}
                      </span>
                    ))}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <MyWorklogWidget />

      <RoadmapWidget />

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Projects</p>

        {projects === null ? (
          <p className="text-sm text-muted-foreground">Loading projects…</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="rounded-xl border border-border bg-card p-4 font-medium text-foreground hover:opacity-80"
              >
                {project.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Boards</p>

        {boards === null ? (
          <p className="text-sm text-muted-foreground">Loading boards…</p>
        ) : boards.length === 0 ? (
          <p className="text-sm text-muted-foreground">No boards yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <Link
                key={board.id}
                to={`/sprints/${board.id}`}
                className="rounded-xl border border-border bg-card p-4 font-medium text-foreground hover:opacity-80"
              >
                {board.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default DashboardPage;
