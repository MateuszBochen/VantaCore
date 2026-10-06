import type {Board} from '@/lib/Board/Type/types';

// A purely local, unsaved board - nothing is sent to the API until the user
// actually submits a step (same pattern as createDraftProject/createDraftTicket).
const createDraftBoard = (): Board => ({
  id: crypto.randomUUID(),
  name: '',
  projectIds: [],
  columns: [],
  // Permissive by default - locking editing/estimation is an opt-in choice,
  // not the default a freshly created board should start with.
  allowEditTicketInActiveSprint: true,
  allowChangeEstimateInActiveSprint: true,
  allowAddTicketToActiveSprint: true,
  allowRemoveTicketFromActiveSprint: true,
});

export default createDraftBoard;
