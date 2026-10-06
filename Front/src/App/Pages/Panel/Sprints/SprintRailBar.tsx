import type {SprintRail} from './useSprintRail';
import type {StatusMeta, Track} from './SprintRailBoard';
import {ROOT_KEY, buildChildrenByParent} from './sprintRailTree';
import TicketIsland from './TicketIsland';
import type {Ticket} from '@/lib/Ticket/Type/types';
import type {Flag} from '@/lib/Project/Type/types';

type SprintRailBarProps = {
  rail: SprintRail;
  gridTemplateColumns: string;
  tracks: Track[];
  trackIndexByStatusId: Record<string, number>;
  statusMetaById: Record<string, StatusMeta>;
  flagsByProjectId: Record<string, Flag[]>;
  estimableByIssueTypeId: Record<string, boolean>;
  issueTypeColorById: Record<string, string>;
  onOpenTicket: (ticket: Ticket) => void;
};

// The rail itself spans every column flush with the background (no
// overhang, see memory: project_vantacore_boards_concept). It's just a
// thin structural shell with no color/padding of its own; the actual
// colored content is the root's TicketIsland inside it.
const SprintRailBar = ({
  rail,
  gridTemplateColumns,
  tracks,
  trackIndexByStatusId,
  statusMetaById,
  flagsByProjectId,
  estimableByIssueTypeId,
  issueTypeColorById,
  onOpenTicket,
}: SprintRailBarProps) => {
  const descendants = rail.selected.filter((entry) => entry.ticket.id !== rail.rootTicket.id);
  const childrenByParent = buildChildrenByParent(descendants);
  // A rail's root is always the topmost ancestor (useSprintRail walks up
  // regardless of sprint membership) - it's only genuinely "in the sprint"
  // if it was independently added too, per railTickets' own dedupe comment
  // in SprintBoardPage. When it wasn't, TicketIsland renders it as a plain
  // dashed legend frame (its key) instead of a full interactive card - see
  // inSprint's own comment.
  const rootInSprint = rail.selected.some((entry) => entry.ticket.id === rail.rootTicket.id);

  return (
    <div className="rounded-xl py-1">
      <TicketIsland
        ticket={rail.rootTicket}
        inSprint={rootInSprint}
        children={childrenByParent.get(ROOT_KEY) ?? []}
        childrenByParent={childrenByParent}
        gridTemplateColumns={gridTemplateColumns}
        tracks={tracks}
        trackIndexByStatusId={trackIndexByStatusId}
        statusMetaById={statusMetaById}
        flagsByProjectId={flagsByProjectId}
        estimableByIssueTypeId={estimableByIssueTypeId}
        issueTypeColorById={issueTypeColorById}
        mergeWithPrevious={false}
        mergeWithNext={false}
        topSpacing={0}
        onOpenTicket={onOpenTicket}
      />
    </div>
  );
};

export default SprintRailBar;
