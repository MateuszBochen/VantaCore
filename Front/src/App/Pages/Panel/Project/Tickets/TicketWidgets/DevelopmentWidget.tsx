import TicketDevelopmentSection from '../TicketDevelopmentSection';
import TicketWidgetCard from './TicketWidgetCard';

type DevelopmentWidgetProps = {
  projectId: string;
  ticketId: string;
};

const DevelopmentWidget = ({projectId, ticketId}: DevelopmentWidgetProps) => (
  <TicketWidgetCard>
    <TicketDevelopmentSection projectId={projectId} ticketId={ticketId} />
  </TicketWidgetCard>
);

export default DevelopmentWidget;
