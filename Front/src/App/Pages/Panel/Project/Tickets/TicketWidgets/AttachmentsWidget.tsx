import {AttachmentsSection} from '@/components/Attachment';
import TicketWidgetCard from './TicketWidgetCard';

type AttachmentsWidgetProps = {
  basePath: string;
};

const AttachmentsWidget = ({basePath}: AttachmentsWidgetProps) => (
  <TicketWidgetCard>
    <AttachmentsSection basePath={basePath} />
  </TicketWidgetCard>
);

export default AttachmentsWidget;
