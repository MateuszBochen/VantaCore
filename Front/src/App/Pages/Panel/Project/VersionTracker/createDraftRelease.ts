import type {Release} from '@/lib/Release/Type/types';

// A purely local, unsaved release - nothing is sent to the API until Save
// is actually clicked (same pattern as createDraftBoard/createDraftSprint).
// The generated id doubles as the releaseId the very first PUT upserts
// (see useSaveReleaseHook's own comment on why there's no separate POST).
const createDraftRelease = (projectId: string): Release => ({
  id: crypto.randomUUID(),
  projectId,
  plannedReleaseDate: '',
  afterCarePeriod: '',
  status: 'PLAN',
  versionNumber: '',
  name: '',
  tickets: [],
});

export default createDraftRelease;
