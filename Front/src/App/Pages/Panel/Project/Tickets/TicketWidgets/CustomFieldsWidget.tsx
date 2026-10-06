import TicketCustomFieldsSection from '../TicketCustomFieldsSection';
import TicketWidgetCard from './TicketWidgetCard';
import type {Project} from '@/lib/Project/Type/types';
import type {Ticket} from '@/lib/Ticket/Type/types';

type CustomFieldsWidgetProps = {
  project: Project;
  ticket: Ticket;
  onChange: (patch: Partial<Ticket>) => void;
};

const CustomFieldsWidget = ({project, ticket, onChange}: CustomFieldsWidgetProps) => (
  <TicketWidgetCard>
    <TicketCustomFieldsSection project={project} ticket={ticket} onChange={onChange} />
  </TicketWidgetCard>
);

export default CustomFieldsWidget;
