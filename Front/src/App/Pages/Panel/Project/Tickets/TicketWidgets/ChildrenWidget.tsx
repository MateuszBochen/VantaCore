import TicketChildrenStep from '../TicketChildrenStep';
import TicketWidgetCard from './TicketWidgetCard';
import type {IssueType, Status} from '@/lib/Project/Type/types';
import type {Ticket} from '@/lib/Ticket/Type/types';

type ChildrenWidgetProps = {
  projectId: string;
  ticket: Ticket;
  issueTypes: IssueType[];
  statuses: Status[];
};

const ChildrenWidget = ({projectId, ticket, issueTypes, statuses}: ChildrenWidgetProps) => (
  <TicketWidgetCard>
    <TicketChildrenStep projectId={projectId} ticket={ticket} issueTypes={issueTypes} statuses={statuses} />
  </TicketWidgetCard>
);

export default ChildrenWidget;
