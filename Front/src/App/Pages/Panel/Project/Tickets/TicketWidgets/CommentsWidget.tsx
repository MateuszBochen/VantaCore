import TicketCommentsSection from '../TicketCommentsSection';
import TicketWidgetCard from './TicketWidgetCard';

type CommentsWidgetProps = {
  projectId: string;
  ticketId: string;
  highlightCommentId?: string | null;
};

const CommentsWidget = ({projectId, ticketId, highlightCommentId}: CommentsWidgetProps) => (
  <TicketWidgetCard>
    <TicketCommentsSection projectId={projectId} ticketId={ticketId} highlightCommentId={highlightCommentId} />
  </TicketWidgetCard>
);

export default CommentsWidget;
