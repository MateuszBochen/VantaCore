import {forwardRef} from 'react';
import TicketTestCasesSection, {type TicketTestCasesSectionHandle} from '../TicketTestCasesSection';
import TicketWidgetCard from './TicketWidgetCard';

type TestCasesWidgetProps = {
  projectId: string;
  ticketId: string;
};

// Forwards the ref through - Submit needs to reach TicketTestCasesSection's
// own imperative submit() (it saves through its own dedicated endpoint, not
// the general ticket PUT) whenever this widget is present in the active
// layout. See TicketEditor's handleSubmit.
const TestCasesWidget = forwardRef<TicketTestCasesSectionHandle, TestCasesWidgetProps>(({projectId, ticketId}, ref) => (
  <TicketWidgetCard>
    <TicketTestCasesSection ref={ref} projectId={projectId} ticketId={ticketId} />
  </TicketWidgetCard>
));

TestCasesWidget.displayName = 'TestCasesWidget';

export default TestCasesWidget;
