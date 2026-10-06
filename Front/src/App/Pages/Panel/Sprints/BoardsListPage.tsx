import {useEffect, useState} from 'react';
import {PageContainer} from '@/components/ui/page-container';
import {Link} from 'react-router-dom';
import {useSetModuleTitle} from '../ModuleTitle';
import useListBoardsHook from '@/lib/Board/useListBoardsHook';
import useListSprintsHook from '@/lib/Sprint/useListSprintsHook';
import type {BoardSummary} from '@/lib/Board/Type/types';
import type {Sprint} from '@/lib/Sprint/Type/types';

type BoardStats = {
  sprintCount: number;
  closedCount: number;
  activeSprint: Sprint | null;
  activeUnitSummaries: {unit: string; committed: number; completed: number}[];
};

// Active sprint's own committed/completed snapshot, per unit - already on
// the sprint object (no ticket fetch needed), same fields BoardPage's own
// header stat tiles use.
const buildActiveUnitSummaries = (sprint: Sprint) => {
  const units = new Set<string>();
  sprint.initialEstimateUnit.forEach((entry) => units.add(entry.unit));
  sprint.actualEstimateUnit.forEach((entry) => units.add(entry.unit));

  return Array.from(units).map((unit) => ({
    unit,
    committed: sprint.initialEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0,
    completed: sprint.actualEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0,
  }));
};

// Cross-project, unlike Tickets/Documentation - this isn't nested under
// /projects/:id (see memory: project_vantacore_boards_concept).
const BoardsListPage = () => {
  const {listBoards} = useListBoardsHook();
  const {listSprints} = useListSprintsHook();
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [statsByBoardId, setStatsByBoardId] = useState<Map<string, BoardStats>>(new Map());

  useSetModuleTitle('Sprints');

  useEffect(() => {
    let cancelled = false;

    listBoards().then((result) => {
      if (!cancelled && result.success) {
        setBoards(result.boards);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listBoards is a thin useRequestHook wrapper recreated every render
  }, []);

  // One sprint list per board (BoardSummary itself carries nothing but
  // {id, name} - there's no way to get sprint counts without this), fetched
  // in parallel once the board list is in. A board that fails to resolve
  // just keeps its card sprint-free (graceful degradation, same as
  // useSprintRail's own per-ticket handling).
  useEffect(() => {
    if (!boards) {
      return;
    }

    let cancelled = false;

    Promise.all(boards.map((board) => listSprints(board.id).then((result) => [board.id, result] as const))).then(
      (entries) => {
        if (cancelled) {
          return;
        }

        const map = new Map<string, BoardStats>();

        entries.forEach(([boardId, result]) => {
          if (!result.success) {
            return;
          }

          const closedCount = result.sprints.filter((sprint) => sprint.status === 'closed').length;
          const activeSprint = result.sprints.find((sprint) => sprint.status === 'active') ?? null;

          map.set(boardId, {
            sprintCount: result.sprints.length,
            closedCount,
            activeSprint,
            activeUnitSummaries: activeSprint ? buildActiveUnitSummaries(activeSprint) : [],
          });
        });

        setStatsByBoardId(map);
      },
    );

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listSprints is a thin useRequestHook wrapper recreated every render; boards is joined below since arrays aren't referentially stable
  }, [boards?.map((board) => board.id).join(',')]);

  return (
    <PageContainer>
      {boards === null ? (
        <p className="text-sm text-muted-foreground">Loading boards…</p>
      ) : boards.length === 0 ? (
        <p className="text-sm text-muted-foreground">No boards yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {boards.map((board) => {
            const stats = statsByBoardId.get(board.id);

            return (
              <Link
                key={board.id}
                to={`/sprints/${board.id}`}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 hover:opacity-80"
              >
                <p className="font-medium text-foreground">{board.name}</p>

                {stats && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {stats.sprintCount} sprint{stats.sprintCount === 1 ? '' : 's'} · {stats.closedCount} closed
                    </span>

                    {stats.activeSprint && (
                      <span className="text-accent">
                        Active: {stats.activeSprint.name} · {stats.activeSprint.startDate} → {stats.activeSprint.endDate}
                        {stats.activeUnitSummaries.map(({unit, committed, completed}) => (
                          <span key={unit || '(no unit)'}>
                            {' '}
                            · {completed}/{committed} {unit || '(no unit)'}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default BoardsListPage;
