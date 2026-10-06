import TicketWorklogSection from '../TicketWorklogSection';
import TicketWorklogStopwatch from '../TicketWorklogStopwatch';
import TicketWidgetCard from './TicketWidgetCard';
import type {Ticket} from '@/lib/Ticket/Type/types';

type WorklogWidgetProps = {
  projectId: string;
  ticket: Ticket;
  // Full replace, not a patch - TicketWorklogSection's own onChange contract
  // (see its own comment) differs from the rest of the widgets here; wire
  // this straight to the page's setDraft.
  onChange: (ticket: Ticket) => void;
  // TicketWorklogStopwatch's own onChange is patch-style (matches
  // TicketFieldsSidebar's convention, unlike TicketWorklogSection above) -
  // wire this to the page's patch-merging handler (handleFieldsPatch).
  onFieldsChange: (patch: Partial<Ticket>) => void;
};

// Combines two components that used to live in different places at once
// (TicketWorklogStopwatch was only ever the sidebar prism's compact
// "Worklog" face; TicketWorklogSection was only ever the top Stepper's own
// "Worklog" step) - devops/jira/custom have no separate prism to put the
// stopwatch in, so both stack in this one widget instead. Confirmed live:
// building this widget from TicketWorklogSection alone (the earlier
// mistake) silently dropped the Start/Stop timer, since that lives ONLY in
// TicketWorklogStopwatch - the two are siblings, not one a superset of the
// other. Both keep their own "Worklog" heading (not worth editing two
// otherwise-untouched, already-shared components just to suppress one).
const WorklogWidget = ({projectId, ticket, onChange, onFieldsChange}: WorklogWidgetProps) => (
  <TicketWidgetCard className="gap-4">
    <TicketWorklogStopwatch projectId={projectId} ticket={ticket} onChange={onFieldsChange} />
    <div className="border-t border-border pt-4">
      <TicketWorklogSection projectId={projectId} ticket={ticket} onChange={onChange} />
    </div>
  </TicketWidgetCard>
);

export default WorklogWidget;
