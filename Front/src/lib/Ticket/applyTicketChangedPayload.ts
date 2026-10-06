import type {TicketSummary} from './Type/types';

// Merges a TICKET_CHANGED websocket payload into an existing TicketSummary
// list - only patches an entry already present (id match), used by both
// TicketsPage (root list) and TicketRow (lazily-loaded children) to keep an
// open list live without a full refetch, which would also collapse whatever
// rows the user had expanded. `progress` isn't carried by this event, so an
// existing entry's progress is left untouched. Returns the same array
// reference when nothing matches, so callers can setState without an extra
// re-render.
// Generic so callers holding a TicketSummary superset (e.g. SprintTicketPicker's
// RegisteredTicket, which adds projectId) keep their own type back.
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');
const isNumberOrNull = (value: unknown): value is number | null => value === null || typeof value === 'number';

const applyTicketChangedPayload = <T extends TicketSummary>(tickets: T[], payload: unknown): T[] => {
  if (typeof payload !== 'object' || payload === null) {
    return tickets;
  }

  const record = payload as Record<string, unknown>;
  const id = record.id;

  if (typeof id !== 'string') {
    return tickets;
  }

  const index = tickets.findIndex((ticket) => ticket.id === id);

  if (index === -1) {
    return tickets;
  }

  const {key, title, issueTypeId, statusId, priority, estimate, estimateAll, assigneeIds, flagIds, tags} = record;

  // estimate/estimateAll can legitimately be null (cleared), so they're
  // patched on key presence, not truthiness.
  const patched: T = {
    ...tickets[index],
    ...(typeof key === 'string' ? {key} : {}),
    ...(typeof title === 'string' ? {title} : {}),
    ...(typeof issueTypeId === 'string' ? {issueTypeId} : {}),
    ...(typeof statusId === 'string' ? {statusId} : {}),
    ...(typeof priority === 'number' ? {priority: priority as TicketSummary['priority']} : {}),
    ...('estimate' in record && isNumberOrNull(estimate) ? {estimate} : {}),
    ...('estimateAll' in record && isNumberOrNull(estimateAll) ? {estimateAll} : {}),
    ...(isStringArray(assigneeIds) ? {assigneeIds} : {}),
    ...(isStringArray(flagIds) ? {flagIds} : {}),
    ...(isStringArray(tags) ? {tags} : {}),
  };

  const next = [...tickets];
  next[index] = patched;

  return next;
};

export default applyTicketChangedPayload;
