import TicketFieldsSidebar from '../TicketFieldsSidebar';
import TicketWidgetCard from './TicketWidgetCard';
import type {ProjectSprintOption} from '@/lib/Sprint/useListProjectSprintsHook';
import type {Project} from '@/lib/Project/Type/types';
import type {Ticket} from '@/lib/Ticket/Type/types';

type FieldsWidgetProps = {
  project: Project;
  ticket: Ticket;
  onChange: (patch: Partial<Ticket>) => void;
  sprintOptions: ProjectSprintOption[];
};

const FieldsWidget = ({project, ticket, onChange, sprintOptions}: FieldsWidgetProps) => (
  <TicketWidgetCard>
    <TicketFieldsSidebar project={project} ticket={ticket} onChange={onChange} sprintOptions={sprintOptions} />
  </TicketWidgetCard>
);

export default FieldsWidget;
