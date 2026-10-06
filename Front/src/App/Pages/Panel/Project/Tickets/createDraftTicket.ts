import type {Ticket} from '@/lib/Ticket/Type/types';

// A purely local, unsaved ticket - `key` is left blank because it's a
// server-assigned sequence (Project prefix + startingNumber), not something
// safe to compute client-side; the real key appears once isNew's Submit
// navigates to the persisted /tickets/:id route and re-fetches.
const createDraftTicket = (projectId: string, parentId: string | null = null): Ticket => ({
  id: crypto.randomUUID(),
  key: '',
  authorId: '',
  projectId,
  subProjectId: null,
  sprint: null,
  issueTypeId: '',
  statusId: '',
  parentId,
  title: '',
  description: '',
  priority: 2,
  estimate: null,
  assigneeIds: [],
  flagIds: [],
  tags: [],
  customFields: {},
  relatedTickets: [],
  timeSpent: 0,
  timeSpentAll: 0,
  estimateAll: null,
  progress: null,
  childCount: 0,
  createdAt: '',
});

export default createDraftTicket;