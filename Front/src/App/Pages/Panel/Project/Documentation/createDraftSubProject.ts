import type {SubProject} from '@/lib/Project/Type/types';

// A purely local, unsaved sub-project - nothing is sent to the API until the
// user actually submits a step.
const createDraftSubProject = (): SubProject => ({
  id: crypto.randomUUID(),
  name: 'Untitled sub-project',
  documentation: {
    scope: '',
    impactAnalysis: '',
    solutionDesign: '',
    adrs: [],
  },
});

export default createDraftSubProject;