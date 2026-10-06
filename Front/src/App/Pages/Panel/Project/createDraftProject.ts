import type {Project} from '../../../../lib/Project/Type/types';

// A purely local, unsaved project shape - the Basics step's default values.
// Nothing is sent to the API until the user actually submits a step.
const createDraftProject = (): Project => ({
  id: crypto.randomUUID(),
  name: 'Untitled project',
  prefix: 'NEW',
  startingNumber: 1000,
  estimateUnit: '',
  statuses: [],
  issueTypes: [],
  automationRules: [],
  flags: [],
  customFieldDefinitions: [],
  platformDocumentation: {
    architectureOverview: '',
    api: '',
    domains: [],
    domainEdges: [],
    boundedContexts: [],
    boundedContextEdges: [],
    components: [],
    componentEdges: [],
    dataFlowNodes: [],
    dataFlowEdges: [],
    infraClusters: [],
    infraClusterEdges: [],
    infraServices: [],
    infraServiceEdges: [],
  },
  subProjects: [],
});

export default createDraftProject;