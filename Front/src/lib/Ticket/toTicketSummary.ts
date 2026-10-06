import type {Ticket, TicketSummary} from './Type/types';

// fullMode search hits are the exact same object GET .../ticket/{id} returns
// (confirmed 2026-08-13), so this is a straight field-pick down to the
// lighter TicketSummary shape the list rows (TicketRow, SprintTicketPickerRow)
// are built for. Shared by SprintTicketPicker and TicketsPage's search.
const toTicketSummary = (ticket: Ticket): TicketSummary => ({
  id: ticket.id,
  key: ticket.key,
  title: ticket.title,
  projectId: ticket.projectId,
  assigneeIds: ticket.assigneeIds,
  issueTypeId: ticket.issueTypeId,
  statusId: ticket.statusId,
  parentId: ticket.parentId,
  priority: ticket.priority,
  progress: ticket.progress,
  timeSpentAll: ticket.timeSpentAll,
  estimateAll: ticket.estimateAll,
  estimate: ticket.estimate,
  childCount: ticket.childCount,
  tags: ticket.tags,
  flagIds: ticket.flagIds,
  createdAt: ticket.createdAt,
});

export default toTicketSummary;
