import {Fragment, useEffect, useMemo, useState} from 'react';
import {PageContainer} from '@/components/ui/page-container';
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {useSetModuleTitle} from '../ModuleTitle';
import useGetBoardHook from '@/lib/Board/useGetBoardHook';
import useListSprintsHook from '@/lib/Sprint/useListSprintsHook';
import SprintVelocityChart, {type SprintVelocityPoint} from './SprintVelocityChart';
import type {Board} from '@/lib/Board/Type/types';
import type {Sprint} from '@/lib/Sprint/Type/types';

// Compares closed AND active sprints against each other purely from each
// Sprint's own server-computed snapshot fields (initialEstimateUnit/
// actualEstimateUnit/closingEstimateUnit, tickets.length) - no per-ticket
// data is fetched for this (that would mean one useSprintRail resolution
// per selected sprint). Snapshots are also the more historically honest
// source for a CLOSED sprint here: its tickets can keep changing afterwards
// (reassigned, re-estimated, moved to a later sprint's board), so live
// ticket data would silently drift out of sync with "what actually happened
// during that sprint" - only the frozen snapshot stays accurate. An active
// sprint has no frozen snapshot yet (closingEstimateUnit in particular is
// only meaningful once it's closed) - its numbers are just "as of now" and
// keep moving, which is why it's flagged "(in progress)" everywhere it's
// shown rather than presented as equally final. Future sprints are excluded
// entirely - there's nothing to compare yet.
const SprintComparePage = () => {
  const {boardId} = useParams<{boardId: string}>();
  const {getBoard} = useGetBoardHook();
  const {listSprints} = useListSprintsHook();

  const [board, setBoard] = useState<Board | null>(null);
  const [sprints, setSprints] = useState<Sprint[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useSetModuleTitle(board ? `${board.name} — Compare sprints` : 'Compare sprints');

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

  const comparableSprints = useMemo(
    () =>
      (sprints ?? [])
        .filter((sprint) => sprint.status === 'closed' || sprint.status === 'active')
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [sprints],
  );

  const selectedSprints = useMemo(
    () => comparableSprints.filter((sprint) => selectedIds.includes(sprint.id)),
    [comparableSprints, selectedIds],
  );

  const toggleSelected = (sprintId: string, checked: boolean) => {
    setSelectedIds((current) => (checked ? [...current, sprintId] : current.filter((id) => id !== sprintId)));
  };

  const units = useMemo(() => {
    const set = new Set<string>();
    selectedSprints.forEach((sprint) => {
      sprint.initialEstimateUnit.forEach((entry) => set.add(entry.unit));
      sprint.closingEstimateUnit.forEach((entry) => set.add(entry.unit));
      sprint.actualEstimateUnit.forEach((entry) => set.add(entry.unit));
    });
    return Array.from(set);
  }, [selectedSprints]);

  const velocityByUnit = useMemo(() => {
    return units.map<[string, SprintVelocityPoint[]]>((unit) => [
      unit,
      selectedSprints.map((sprint) => ({
        id: sprint.id,
        name: sprint.name,
        committed: sprint.initialEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0,
        completed: sprint.actualEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0,
      })),
    ]);
  }, [units, selectedSprints]);

  if (!boardId) {
    return null;
  }

  return (
    <PageContainer>
      <Link to={`/sprints/${boardId}`} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {board?.name ?? 'Sprints'}
      </Link>

      <p className="text-sm font-semibold text-foreground">Compare sprints</p>

      <div className="flex gap-6">
        <div className="flex w-64 shrink-0 flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Sprints</p>

          {sprints === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : comparableSprints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No closed or active sprints on this board yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {comparableSprints.map((sprint) => (
                <label key={sprint.id} className="flex items-start gap-2 rounded-lg p-1.5 text-sm text-foreground hover:bg-card">
                  <Checkbox
                    checked={selectedIds.includes(sprint.id)}
                    onCheckedChange={(checked) => toggleSelected(sprint.id, checked)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block truncate">
                      {sprint.name}
                      {sprint.status === 'active' && <span className="ml-1.5 text-xs text-amber-400">(in progress)</span>}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {sprint.startDate} → {sprint.endDate}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {selectedSprints.length === 0 ? (
            <p className="text-sm text-muted-foreground">Select sprints on the left to compare them.</p>
          ) : (
            <>
              <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
                {units.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No estimate data on the selected sprints yet.</p>
                ) : (
                  velocityByUnit.map(([unit, points]) => <SprintVelocityChart key={unit || '(no unit)'} unit={unit} points={points} />)
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card p-4">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Sprint</th>
                      {selectedSprints.map((sprint) => (
                        <th key={sprint.id} className="px-4 py-2 font-medium text-muted-foreground">
                          {sprint.name}
                          {sprint.status === 'active' && <span className="ml-1.5 font-normal text-amber-400">(in progress)</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    <tr className="border-b border-border">
                      <td className="py-2 pr-4 text-muted-foreground">Dates</td>
                      {selectedSprints.map((sprint) => (
                        <td key={sprint.id} className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {sprint.startDate} → {sprint.endDate}
                        </td>
                      ))}
                    </tr>

                    <tr className="border-b border-border">
                      <td className="py-2 pr-4 text-muted-foreground">Tickets</td>
                      {selectedSprints.map((sprint) => (
                        <td key={sprint.id} className="px-4 py-2">
                          {sprint.tickets.length}
                        </td>
                      ))}
                    </tr>

                    {units.map((unit) => (
                      <Fragment key={unit}>
                        <tr className="border-b border-border">
                          <td className="py-2 pr-4 text-muted-foreground">Committed ({unit || '(no unit)'})</td>
                          {selectedSprints.map((sprint) => (
                            <td key={sprint.id} className="px-4 py-2">
                              {sprint.initialEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 pr-4 text-muted-foreground">Completed ({unit || '(no unit)'})</td>
                          {selectedSprints.map((sprint) => (
                            <td key={sprint.id} className="px-4 py-2 text-accent">
                              {sprint.actualEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 pr-4 text-muted-foreground">Closing scope ({unit || '(no unit)'})</td>
                          {selectedSprints.map((sprint) => (
                            <td key={sprint.id} className="px-4 py-2">
                              {sprint.closingEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 pr-4 text-muted-foreground">Completion rate ({unit || '(no unit)'})</td>
                          {selectedSprints.map((sprint) => {
                            const committed = sprint.initialEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0;
                            const completed = sprint.actualEstimateUnit.find((entry) => entry.unit === unit)?.value ?? 0;
                            const rate = committed > 0 ? Math.round((completed / committed) * 100) : 0;

                            return (
                              <td key={sprint.id} className="px-4 py-2">
                                {rate}%
                              </td>
                            );
                          })}
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default SprintComparePage;
