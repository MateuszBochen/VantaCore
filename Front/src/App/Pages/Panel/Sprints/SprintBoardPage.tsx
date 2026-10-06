import {useEffect, useMemo, useRef, useState} from 'react';
import {PageContainer} from '@/components/ui/page-container';
import {Link, useParams} from 'react-router-dom';
import {useSetModuleTitle} from '../ModuleTitle';
import {Button} from '@/components/ui/button';
import {UNASSIGNED_USER_ID} from '@/components/ui/user-avatar-stack';
import useGetBoardHook from '@/lib/Board/useGetBoardHook';
import useListSprintsHook from '@/lib/Sprint/useListSprintsHook';
import useGetProjectHook from '@/lib/Project/useGetProjectHook';
import useSprintRail, {type SprintRail} from './useSprintRail';
import SprintRailBoard from './SprintRailBoard';
import SprintFilterBar from './SprintFilterBar';
import SprintProgress, {type SprintUnitProgress} from './SprintProgress';
import TicketPopup, {type TicketPopupHandle} from '../Project/Tickets/TicketPopup';
import type {Board} from '@/lib/Board/Type/types';
import type {Sprint} from '@/lib/Sprint/Type/types';
import type {Ticket, PriorityLevel} from '@/lib/Ticket/Type/types';
import {PRIORITIES} from '@/lib/Ticket/Type/types';
import type {Flag, Project} from '@/lib/Project/Type/types';

// Every DISTINCT ticket a rail actually carries - root plus every selected
// descendant - used both to collect which values show up in each filter
// facet and to decide whether a rail matches the active filters. Deduped
// by id: when the only selected ticket in a hierarchy IS the root itself,
// `rail.selected` already contains that same root ticket, so a naive
// `[rail.rootTicket, ...rail.selected.map(...)]` would return it TWICE -
// harmless for the filter facets (they dedupe through Sets anyway), but a
// real bug for anything that SUMS values across these tickets, like the
// estimate progress bar (found 2026-08-06: a single 2-point ticket was
// showing as 4 points).
const railTickets = (rail: SprintRail): Ticket[] => {
  const byId = new Map<string, Ticket>();
  byId.set(rail.rootTicket.id, rail.rootTicket);
  rail.selected.forEach((entry) => byId.set(entry.ticket.id, entry.ticket));
  return Array.from(byId.values());
};

// Only the tickets actually IN the sprint (rail.selected) - rootTicket is
// ancestor context and may not be a sprint member itself, so it must stay
// out of progress totals (the backend's SprintEstimateCalculator only sums
// sprint members too). railTickets above, root included, is still what the
// filter option lists use - those describe what's visible on the board.
const sprintMemberTickets = (rail: SprintRail): Ticket[] => {
  const byId = new Map<string, Ticket>();
  rail.selected.forEach((entry) => byId.set(entry.ticket.id, entry.ticket));
  return Array.from(byId.values());
};

const toggleInList = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

// The rail/timeline board for a single Sprint (see memory:
// project_vantacore_boards_concept - "Agreed ticket visualization"). Reached
// by clicking any sprint in BoardPage's list, whatever its status - this is
// the same page for a future/active/closed sprint alike. No GET-single-sprint
// endpoint exists, so the sprint is picked out of the list response.
const SprintBoardPage = () => {
  const {boardId, sprintId} = useParams<{boardId: string; sprintId: string}>();
  const {getBoard} = useGetBoardHook();
  const {listSprints} = useListSprintsHook();
  const {getProject} = useGetProjectHook();
  const [board, setBoard] = useState<Board | null>(null);
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useSetModuleTitle(sprint ? `${sprint.name} · ${sprint.startDate} → ${sprint.endDate}` : 'Sprint');

  useEffect(() => {
    if (!boardId || !sprintId) {
      return;
    }

    let cancelled = false;

    getBoard(boardId).then((result) => {
      if (!cancelled && result.success) {
        setBoard(result.board);
      }
    });

    listSprints(boardId).then((result) => {
      if (cancelled || !result.success) {
        return;
      }

      const found = result.sprints.find((candidate) => candidate.id === sprintId);

      if (found) {
        setSprint(found);
      } else {
        setNotFound(true);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getBoard/listSprints are thin useRequestHook wrappers recreated every render
  }, [boardId, sprintId]);

  // Only needed to resolve flagIds -> {name, color} for the flags facet
  // below (same cache-backed pattern SprintRailBoard already uses
  // internally for its own status/flag resolution - a bit of duplicated
  // fetching, but useGetProjectHook is cache-backed so it's a no-op after
  // the first call, and lifting this up to share would touch more files
  // than it's worth right now).
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
  const ticketPopupRef = useRef<TicketPopupHandle>(null);
  const handleOpenTicket = (ticket: Ticket) => ticketPopupRef.current?.open(ticket.projectId, ticket.id, ticket.key);

  // Filtering, starting with assignees and now flags/tags/priority too (see
  // memory: project_vantacore_boards_concept) - "best above the whole
  // board", so this lives here in SprintBoardPage rather than inside
  // SprintRailBoard. A rail is shown at all if ANY ticket in it (root or a
  // selected descendant) satisfies EVERY active facet AT ONCE on that SAME
  // ticket (standard faceted filtering: OR within a facet, AND across
  // facets). Within a shown rail, individual non-root tickets that don't
  // themselves match are hidden - only the root always stays (hierarchy
  // context) plus whichever descendants actually match. Changed 2026-08-14
  // (explicit ask, user found it confusing that filtering by one assignee
  // still showed an unrelated sibling/descendant assigned to someone else) -
  // previously the whole rail stayed intact once any one ticket in it
  // matched.
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedFlagIds, setSelectedFlagIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<PriorityLevel[]>([]);

  const flagsByProjectId = useMemo(() => {
    const map: Record<string, Flag[]> = {};
    projects.forEach((project) => {
      map[project.id] = project.flags;
    });
    return map;
  }, [projects]);

  // Sums each ticket's OWN `estimate` (never `estimateAll`, the hierarchy
  // rollup - same rule as the Sprint ticket picker's summary, to avoid
  // double-counting a parent's total on top of its own selected children),
  // split "done" vs "total" by each status's own `isDone` flag, grouped by
  // the ticket's OWNING project's estimateUnit (a board can span projects
  // with different units). Computed from the full, UNFILTERED `rails` -
  // this represents the sprint's real progress, not whatever a filter
  // happens to currently be narrowing the board down to.
  const progressByUnit = useMemo<SprintUnitProgress[]>(() => {
    if (!rails) {
      return [];
    }

    const isDoneByStatusId: Record<string, boolean> = {};
    const estimateUnitByProjectId: Record<string, string> = {};

    projects.forEach((project) => {
      estimateUnitByProjectId[project.id] = project.estimateUnit;
      project.statuses.forEach((status) => {
        isDoneByStatusId[status.id] = status.isDone;
      });
    });

    const totals: Record<string, {done: number; total: number}> = {};

    // A ticket can sit in several rails' `selected` only once (rails are
    // keyed by root, a ticket has one root) - no cross-rail dedupe needed.
    rails.forEach((rail) =>
      sprintMemberTickets(rail).forEach((ticket) => {
        if (ticket.estimate === null) {
          return;
        }

        const unit = estimateUnitByProjectId[ticket.projectId] ?? '';
        const bucket = totals[unit] ?? {done: 0, total: 0};
        bucket.total += ticket.estimate;

        if (isDoneByStatusId[ticket.statusId]) {
          bucket.done += ticket.estimate;
        }

        totals[unit] = bucket;
      }),
    );

    return Object.entries(totals).map(([unit, {done, total}]) => ({unit, done, total}));
  }, [rails, projects]);

  const assigneeUserIds = useMemo(() => {
    if (!rails) {
      return [];
    }

    const ids = new Set<string>();
    rails.forEach((rail) => railTickets(rail).forEach((ticket) => ticket.assigneeIds.forEach((id) => ids.add(id))));
    return Array.from(ids);
  }, [rails]);

  const availableFlags = useMemo(() => {
    if (!rails) {
      return [];
    }

    const seen = new Map<string, Flag>();
    rails.forEach((rail) =>
      railTickets(rail).forEach((ticket) => {
        ticket.flagIds.forEach((flagId) => {
          if (!seen.has(flagId)) {
            const flag = flagsByProjectId[ticket.projectId]?.find((candidate) => candidate.id === flagId);
            if (flag) {
              seen.set(flagId, flag);
            }
          }
        });
      }),
    );
    return Array.from(seen.values());
  }, [rails, flagsByProjectId]);

  const availableTags = useMemo(() => {
    if (!rails) {
      return [];
    }

    const tags = new Set<string>();
    rails.forEach((rail) => railTickets(rail).forEach((ticket) => ticket.tags.forEach((tag) => tags.add(tag))));
    return Array.from(tags).sort();
  }, [rails]);

  const availablePriorities = useMemo(() => {
    if (!rails) {
      return [];
    }

    const levels = new Set<PriorityLevel>();
    rails.forEach((rail) => railTickets(rail).forEach((ticket) => levels.add(ticket.priority)));
    return PRIORITIES.filter((priority) => levels.has(priority.level));
  }, [rails]);

  const filteredRails = useMemo(() => {
    if (!rails) {
      return rails;
    }

    if (selectedUserIds.length === 0 && selectedFlagIds.length === 0 && selectedTags.length === 0 && selectedPriorities.length === 0) {
      return rails;
    }

    const ticketMatches = (ticket: Ticket) => {
      const matchesUser =
        selectedUserIds.length === 0 ||
        ticket.assigneeIds.some((id) => selectedUserIds.includes(id)) ||
        (ticket.assigneeIds.length === 0 && selectedUserIds.includes(UNASSIGNED_USER_ID));
      const matchesFlag = selectedFlagIds.length === 0 || ticket.flagIds.some((id) => selectedFlagIds.includes(id));
      const matchesTag = selectedTags.length === 0 || ticket.tags.some((tag) => selectedTags.includes(tag));
      const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(ticket.priority);

      return matchesUser && matchesFlag && matchesTag && matchesPriority;
    };

    const filtered: SprintRail[] = [];

    rails.forEach((rail) => {
      // Only actual sprint members decide whether a rail shows - the root
      // included, but only when it's itself in `selected` AND matches. It
      // used to keep the root's own entry unconditionally, which made
      // `matchingSelected` non-empty for every rail whose root was in the
      // sprint, so those rails always showed regardless of the filter (real
      // report: filtering by one tag still showed unrelated tickets). A
      // non-matching root is still drawn as hierarchy context whenever a
      // descendant matches - SprintRailBar just renders it as the dashed
      // legend frame (rootInSprint=false) instead of a full card, which also
      // visually marks it as "not a hit".
      const matchingSelected = rail.selected.filter((entry) => ticketMatches(entry.ticket));

      if (matchingSelected.length > 0) {
        filtered.push({rootTicket: rail.rootTicket, selected: matchingSelected});
      }
    });

    return filtered;
  }, [rails, selectedUserIds, selectedFlagIds, selectedTags, selectedPriorities]);

  const handleToggleUser = (userId: string) => setSelectedUserIds((current) => toggleInList(current, userId));
  const handleToggleFlag = (flagId: string) => setSelectedFlagIds((current) => toggleInList(current, flagId));
  const handleToggleTag = (tag: string) => setSelectedTags((current) => toggleInList(current, tag));
  const handleTogglePriority = (level: PriorityLevel) => setSelectedPriorities((current) => toggleInList(current, level));

  if (notFound) {
    return <p className="p-8 text-sm text-muted-foreground">This sprint doesn't exist.</p>;
  }

  if (!board || !sprint) {
    return <p className="p-8 text-sm text-muted-foreground">Loading sprint…</p>;
  }

  return (
    <PageContainer className="py-8 pl-8 pr-4">
      <div className="flex items-baseline justify-between">
        {/* Name/dates already show in WorkPlaceHeader's title (see
            useSetModuleTitle above) - only status is left to show here. */}
        <p className="text-xs text-muted-foreground">{sprint.status}</p>

        <div className="flex items-center gap-4">
          <SprintProgress progress={progressByUnit} startDate={sprint.startDate} endDate={sprint.endDate} />

          <Button size="sm" asChild>
            <Link to={`/sprints/${boardId}/sprints/${sprintId}/summary`}>Summary</Link>
          </Button>
        </div>
      </div>

      {rails !== null && rails.length > 0 && (
        <SprintFilterBar
          assigneeUserIds={assigneeUserIds}
          selectedUserIds={selectedUserIds}
          onToggleUser={handleToggleUser}
          flags={availableFlags}
          selectedFlagIds={selectedFlagIds}
          onToggleFlag={handleToggleFlag}
          tags={availableTags}
          selectedTags={selectedTags}
          onToggleTag={handleToggleTag}
          priorities={availablePriorities}
          selectedPriorities={selectedPriorities}
          onTogglePriority={handleTogglePriority}
        />
      )}

      {/* min-h-0 + flex-1 (not just h-full on SprintRailBoard's own root) is
          what actually caps this to "whatever's left after the header/filter
          bar above" and lets it shrink below its content size - without it,
          SprintRailBoard just grows to fit every rail, pushing this whole
          page taller and making the browser scroll the entire WorkPlace
          instead of just the rails scrolling inside their own region (bug
          found 2026-08-06, once a sprint had enough tickets to notice). */}
      <div className="min-h-0 flex-1">
        {rails === null ? (
          <p className="text-sm text-muted-foreground">Loading tickets…</p>
        ) : rails.length > 0 && filteredRails?.length === 0 ? (
          // Distinct from SprintRailBoard's own "No tickets in this sprint
          // yet." empty state - that one means the sprint is genuinely empty,
          // this means the filter hid everything that IS there.
          <p className="text-sm text-muted-foreground">No tickets match the current filter.</p>
        ) : (
          <SprintRailBoard board={board} rails={filteredRails ?? []} onOpenTicket={handleOpenTicket} />
        )}
      </div>

      <TicketPopup ref={ticketPopupRef} />
    </PageContainer>
  );
};

export default SprintBoardPage;
