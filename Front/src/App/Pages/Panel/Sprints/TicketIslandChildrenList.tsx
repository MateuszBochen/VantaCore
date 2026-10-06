import type {StatusMeta, Track} from './SprintRailBoard';
import type {SelectedEntry} from './sprintRailTree';
import TicketIsland from './TicketIsland';
import type {Ticket} from '@/lib/Ticket/Type/types';
import type {Flag} from '@/lib/Project/Type/types';

type TicketIslandChildrenListProps = {
  className: string;
  entries: SelectedEntry[];
  childrenByParent: Map<string, SelectedEntry[]>;
  gridTemplateColumns: string;
  tracks: Track[];
  trackIndexByStatusId: Record<string, number>;
  statusMetaById: Record<string, StatusMeta>;
  flagsByProjectId: Record<string, Flag[]>;
  estimableByIssueTypeId: Record<string, boolean>;
  issueTypeColorById: Record<string, string>;
  onOpenTicket: (ticket: Ticket) => void;
};

// Shared between a real island's expanded body and the not-in-sprint dashed
// frame - both nest their selected descendants the same way. No `gap` here
// (unlike a plain sibling list elsewhere) - each child instead gets an
// explicit `topSpacing` (see TicketIsland), 0 for merged pairs and the
// first item, 6px otherwise. A real `gap`/margin between two merged,
// same-color islands leaves a sliver where the page's background shows
// through, which reads as a dividing line even with border+radius
// correctly zeroed on both sides (confirmed 2026-08-07 via DevTools).
const TicketIslandChildrenList = ({
  className,
  entries,
  childrenByParent,
  gridTemplateColumns,
  tracks,
  trackIndexByStatusId,
  statusMetaById,
  flagsByProjectId,
  estimableByIssueTypeId,
  issueTypeColorById,
  onOpenTicket,
}: TicketIslandChildrenListProps) => (
  <div className={className}>
    {entries.map((entry, index) => {
      const previousType = entries[index - 1]?.ticket.issueTypeId;
      const nextType = entries[index + 1]?.ticket.issueTypeId;
      const mergeWithPrevious = previousType === entry.ticket.issueTypeId;

      return (
        <TicketIsland
          key={entry.ticket.id}
          ticket={entry.ticket}
          inSprint
          children={childrenByParent.get(entry.ticket.id) ?? []}
          childrenByParent={childrenByParent}
          gridTemplateColumns={gridTemplateColumns}
          tracks={tracks}
          trackIndexByStatusId={trackIndexByStatusId}
          statusMetaById={statusMetaById}
          flagsByProjectId={flagsByProjectId}
          estimableByIssueTypeId={estimableByIssueTypeId}
          issueTypeColorById={issueTypeColorById}
          mergeWithPrevious={mergeWithPrevious}
          mergeWithNext={nextType === entry.ticket.issueTypeId}
          topSpacing={index === 0 || mergeWithPrevious ? 0 : 6}
          onOpenTicket={onOpenTicket}
        />
      );
    })}
  </div>
);

export default TicketIslandChildrenList;
