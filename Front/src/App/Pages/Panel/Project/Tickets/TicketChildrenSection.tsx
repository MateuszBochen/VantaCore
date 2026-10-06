import {memo, useEffect, useState} from 'react';
import {Plus} from 'lucide-react';
import ActionLink from '@/components/ui/ActionLink';
import useGetTicketsHook from '@/lib/Ticket/useGetTicketsHook';
import type {Flag, IssueType, Status} from '@/lib/Project/Type/types';
import type {Ticket, TicketSummary} from '@/lib/Ticket/Type/types';
import TicketRow from './TicketRow';

type TicketChildrenSectionProps = {
  projectId: string;
  ticket: Ticket;
  issueTypes: IssueType[];
  statuses: Status[];
  flags: Flag[];
};

// Only shown for an already-persisted ticket (isNew has no id children could
// point at yet) - see TicketPage.
const TicketChildrenSection = memo(({projectId, ticket, issueTypes, statuses, flags}: TicketChildrenSectionProps) => {
  const {getTickets} = useGetTicketsHook();
  const [children, setChildren] = useState<TicketSummary[] | null>(null);
  const issueType = issueTypes.find((type) => type.id === ticket.issueTypeId) ?? null;
  const canHaveChildren = !!issueType && issueType.childTypeIds.length > 0;

  useEffect(() => {
    let cancelled = false;

    getTickets(projectId, ticket.id).then((result) => {
      if (!cancelled && result.success) {
        setChildren(result.tickets);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTickets is a thin useRequestHook wrapper recreated every render
  }, [projectId, ticket.id]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-foreground">Children</p>

      {children === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : children.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sub-tickets.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {children.map((child) => (
            <TicketRow key={child.id} projectId={projectId} ticket={child} issueTypes={issueTypes} statuses={statuses} flags={flags} depth={0} />
          ))}
        </div>
      )}

      {canHaveChildren && (
        <ActionLink to={`/projects/${projectId}/tickets/new?parentId=${ticket.id}`}>
          <Plus className="h-4 w-4" />
          Add child
        </ActionLink>
      )}
    </div>
  );
});

TicketChildrenSection.displayName = 'TicketChildrenSection';

export default TicketChildrenSection;