import {useEffect, useMemo, useState} from 'react';
import useGetProjectHook from '@/lib/Project/useGetProjectHook';
import type {Flag, Project} from '@/lib/Project/Type/types';
import type {Board} from '@/lib/Board/Type/types';
import type {Ticket} from '@/lib/Ticket/Type/types';
import type {SprintRail} from './useSprintRail';
import SprintRailBar from './SprintRailBar';
import {statusKey} from './statusKey';

type SprintRailBoardProps = {
  board: Board;
  rails: SprintRail[];
  onOpenTicket: (ticket: Ticket) => void;
};

export type Track = {
  id: string;
  name: string;
  dotColor: string | null;
  // Every statusId this column maps to - a drag-drop onto this column
  // assigns the ticket the FIRST one (a column can group several statuses,
  // there's no way to know which one the user "meant" from position alone).
  // Empty for the synthetic "Unmapped status" track, which is never itself
  // a valid drop target.
  statusIds: string[];
};

export type StatusMeta = {
  name: string;
  color: string;
  // Which issue type this entry's workflow belongs to - part of the lookup
  // key now (see statusKey), not unique metadata per statusId. Statuses are
  // project-level and shared (see the Status & Workflow Model sub-project),
  // so the SAME status id can appear in several issue types' workflows,
  // each with its own allowedTransitionIds - "the" issue type for a bare
  // statusId no longer means anything on its own.
  issueTypeId: string;
  // This issue type's own configured allowedTransitionIds for this status
  // (IssueType.workflow, not the status itself) - which OTHER statuses a
  // ticket CURRENTLY in this one is allowed to move to. Drag/drop and the
  // status picker both need this to stop the board from letting any status
  // jump to any other status regardless of the workflow defined in Project
  // Settings (explicit ask 2026-08-06/07).
  allowedTransitionIds: string[];
};

// Per the user's sketch: columns are plain background tracks; a rail is one
// row per root-ticket hierarchy that visibly spans (and slightly overhangs)
// every column, with a fixed ticket label on the left and a small colored
// "slider" that positions itself at whichever column matches the root
// ticket's current status (see memory: project_vantacore_boards_concept -
// "jak kalendarze z okienkiem dnia" / "Ruchomy slider ze statusem"). Every
// nested (selected) descendant gets the same treatment recursively, via its
// OWN status - not just the root - so `trackIndexByStatusId` is keyed by
// statusId, not by rail/root, and is resolved by SprintRailBar for whichever
// ticket it's currently rendering.
const SprintRailBoard = ({board, rails, onOpenTicket}: SprintRailBoardProps) => {
  const {getProject} = useGetProjectHook();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
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
  }, [board.projectIds.join(',')]);

  const statusMetaById = useMemo(() => {
    const map: Record<string, StatusMeta> = {};

    projects.forEach((project) => {
      const statusesById = new Map(project.statuses.map((status) => [status.id, status]));

      project.issueTypes.forEach((issueType) => {
        issueType.workflow.forEach((entry) => {
          const status = statusesById.get(entry.statusId);
          if (!status) {
            return;
          }

          map[statusKey(issueType.id, status.id)] = {
            name: status.name,
            color: status.color,
            issueTypeId: issueType.id,
            allowedTransitionIds: entry.allowedTransitionIds,
          };
        });
      });
    });

    return map;
  }, [projects]);

  // A board can span multiple projects, and each project has its OWN
  // flags catalog - so a ticket's flagIds must be resolved against ITS
  // OWNING project specifically (via Ticket.projectId), not a flat merge.
  const flagsByProjectId = useMemo(() => {
    const map: Record<string, Flag[]> = {};

    projects.forEach((project) => {
      map[project.id] = project.flags;
    });

    return map;
  }, [projects]);

  // Whether a ticket's own issue type even tracks estimates at all
  // (IssueType.estimable) - drives the estimate badge vs. crossed-out
  // circle in SprintRailBar.
  const estimableByIssueTypeId = useMemo(() => {
    const map: Record<string, boolean> = {};

    projects.forEach((project) => {
      project.issueTypes.forEach((issueType) => {
        map[issueType.id] = issueType.estimable;
      });
    });

    return map;
  }, [projects]);

  // A ticket's ISLAND (the bordered/tinted box, not the status slider inside
  // it) is colored by its issue type, not its current status (explicit ask
  // 2026-08-07 - a ticket's identity/type shouldn't visually change color
  // every time its status moves, unlike the slider which is meant to).
  const issueTypeColorById = useMemo(() => {
    const map: Record<string, string> = {};

    projects.forEach((project) => {
      project.issueTypes.forEach((issueType) => {
        map[issueType.id] = issueType.color;
      });
    });

    return map;
  }, [projects]);

  const {tracks, trackIndexByStatusId} = useMemo(() => {
    const builtTracks: Track[] = board.columns.map((column) => ({
      id: column.id,
      name: column.name,
      dotColor: column.color,
      statusIds: column.statusIds,
    }));

    // Only statuses actually used by a ticket currently shown (root or any
    // selected descendant) should decide whether the synthetic "Unmapped
    // status" track appears - not every status that merely exists somewhere
    // in a linked project's issue types.
    const usedStatusIds = new Set<string>();
    rails.forEach((rail) => {
      usedStatusIds.add(rail.rootTicket.statusId);
      rail.selected.forEach((entry) => usedStatusIds.add(entry.ticket.statusId));
    });

    const indexByStatusId: Record<string, number> = {};
    let hasUnmapped = false;

    usedStatusIds.forEach((statusId) => {
      const columnIndex = board.columns.findIndex((column) => column.statusIds.includes(statusId));

      if (columnIndex === -1) {
        hasUnmapped = true;
      } else {
        indexByStatusId[statusId] = columnIndex;
      }
    });

    if (hasUnmapped) {
      const unmappedIndex = builtTracks.length;
      builtTracks.push({id: '__unmapped', name: 'Unmapped status', dotColor: null, statusIds: []});

      usedStatusIds.forEach((statusId) => {
        if (!(statusId in indexByStatusId)) {
          indexByStatusId[statusId] = unmappedIndex;
        }
      });
    }

    return {tracks: builtTracks, trackIndexByStatusId: indexByStatusId};
  }, [board.columns, rails]);

  if (rails.length === 0) {
    return <p className="text-sm text-muted-foreground">No tickets in this sprint yet.</p>;
  }

  const gridTemplateColumns = `repeat(${tracks.length}, minmax(0, 1fr))`;

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Header lives OUTSIDE the scroll box entirely (2026-08-07,
          replacing the earlier "single shared scroll container" design -
          see memory: project_vantacore_boards_concept for the full saga).
          That older design put header + background + rails all inside ONE
          `overflow-y-auto` box specifically so they'd always share the
          exact same available width, scrollbar or not - a real, previously
          fixed bug (rails' own scrollbar shrinking ONLY the rails' width,
          not its siblings', drifted the slider off its real column). But
          it meant the STICKY header had ticket cards continuously
          scrolling BEHIND it, and `bg-card` (needed for the "column cap"
          look) was nowhere near opaque enough to mask them - tickets'
          colors visibly bled/ghosted through as they passed underneath, no
          matter how much the header's own opacity was pushed (tried
          `bg-popover` on individual cells, then on the whole shell -
          both reverted, real user feedback: "to nie wygląda dobrze" /
          "takie tło w ogóle nie pasuje").

          Root-caused together 2026-08-07: the header being the scroll
          box's own first child meant scrolling ALWAYS started exactly at
          the header's own top edge - there was no way to keep it opaque
          enough for every ticket color while keeping the "translucent
          glass" look intact. The real fix is structural, not another
          coat of paint: take the header OUT of the scrolling flow
          entirely, so nothing ever scrolls behind it to need masking in
          the first place. The old width-matching bug is avoided instead
          of reintroduced by giving BOTH this header AND the scroll box
          below `scrollbarGutter: 'stable'` (reserves the scrollbar's
          width in the layout permanently, whether or not a scrollbar is
          actually being drawn right now) - so their available content
          width is identical and CONSTANT regardless of scroll state,
          without needing to literally share one scrolling element to get
          there. This header's own content never overflows it vertically,
          so `overflow-y: auto` here never shows a real scrollbar - it's
          only present so `scrollbar-gutter` has something to apply to. */}
      <div
        className="grid shrink-0 gap-4 overflow-y-auto px-3"
        style={{scrollbarGutter: 'stable', gridTemplateColumns}}
      >
        {tracks.map((track) => (
          <div
            key={track.id}
            className="flex items-center justify-center gap-2 border border-border bg-card pt-3 pb-2"
            style={{borderBottomWidth: 0, borderTopLeftRadius: 16, borderTopRightRadius: 16}}
          >
            {track.dotColor && <span className="h-2 w-2 rounded-full" style={{backgroundColor: track.dotColor}} />}
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{track.name}</p>
          </div>
        ))}
      </div>

      {/* The ONLY thing that scrolls now - background + rails, unchanged
          from before other than living one level further out (no longer
          needs to also host the header). `scrollbarGutter: 'stable'`
          matches the header's own reservation above, keeping both
          pixel-aligned with each other at all times - see the big comment
          above for the full reasoning. */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto" style={{scrollbarGutter: 'stable'}}>
        <div className="relative flex-1">
          {/* Background column tracks - inset a bit narrower than the rails
              below, matching the SAME `left-3`/`right-3` as the rails
              list's own `mx-3` (flush, no overhang - see memory:
              project_vantacore_boards_concept). `absolute inset-0` against
              the `relative flex-1` wrapper right below, which now spans AT
              LEAST the remaining space in the scroll box (its own `flex-1`
              inside that box's `flex-col`) even when the rails' own
              content is short - real user feedback
              2026-08-07 ("wysokość kolumn przestała być na 100%") after a
              more compact card redesign meant fewer tickets no longer
              produced enough content to coincidentally reach the bottom of
              the panel on its own, the way it used to. If content DOES
              grow taller than the available space, this wrapper naturally
              grows past its flex-basis to fit it (flex items don't clip to
              their basis by default) and the scroll box above handles the
              overflow, exactly as before - so both "at least fill the
              panel" and "grow + scroll for lots of tickets" keep working
              together without a hardcoded height anywhere. */}
          <div className="pointer-events-none absolute inset-0 left-3 right-3 grid gap-4" style={{gridTemplateColumns}}>
            {tracks.map((track) => (
              // Top border/rounding dropped (inline style, see the header
              // cap above for why) so this box's top edge is invisible and
              // flows directly out of the (now non-scrolling) header's own
              // bottom edge - together they read as one continuous rounded
              // shape, cap and body, rather than two separately-bordered
              // pieces.
              <div
                key={track.id}
                className="h-full border border-border bg-card"
                style={{borderTopWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16}}
              />
            ))}
          </div>

          {/* Rails - inset `mx-3` (12px each side), matching the background
              layer's own `left-3`/`right-3` inset exactly, so a rail sits
              flush with its columns instead of overhanging past the
              first/last one (removed 2026-08-07 per real user feedback -
              the overhang was previously a deliberate, repeatedly-requested
              choice; see memory: project_vantacore_boards_concept). Since
              both layers now share the same total width, SprintRailBar
              needs no extra inset of its own to keep the slider
              pixel-aligned with the actual background columns. */}
          <div className="relative mx-3 flex flex-col gap-2 pb-3">
            {rails.map((rail) => (
              <SprintRailBar
                key={rail.rootTicket.id}
                rail={rail}
                gridTemplateColumns={gridTemplateColumns}
                tracks={tracks}
                trackIndexByStatusId={trackIndexByStatusId}
                statusMetaById={statusMetaById}
                flagsByProjectId={flagsByProjectId}
                estimableByIssueTypeId={estimableByIssueTypeId}
                issueTypeColorById={issueTypeColorById}
                onOpenTicket={onOpenTicket}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintRailBoard;
