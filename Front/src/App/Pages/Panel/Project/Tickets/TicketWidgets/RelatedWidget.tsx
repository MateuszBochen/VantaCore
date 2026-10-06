import TicketRelatedSection from '../TicketRelatedSection';
import TicketWidgetCard from './TicketWidgetCard';
import type {Ticket} from '@/lib/Ticket/Type/types';

type RelatedWidgetProps = {
  ticket: Ticket;
  onChange: (patch: Partial<Ticket>) => void;
};

const RelatedWidget = ({ticket, onChange}: RelatedWidgetProps) => (
  <TicketWidgetCard>
    <TicketRelatedSection ticket={ticket} onChange={onChange} />
  </TicketWidgetCard>
);

export default RelatedWidget;
