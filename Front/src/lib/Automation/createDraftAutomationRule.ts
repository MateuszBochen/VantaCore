import type {AutomationEngineRule} from './Type/types';

// A purely local, unsaved rule - nothing is sent to the API until Submit.
const createDraftAutomationRule = (projectId: string): AutomationEngineRule => ({
  id: crypto.randomUUID(),
  projectId,
  name: 'New rule',
  enabled: true,
  trigger: {type: 'TICKET_CREATED', params: {}},
  conditions: [],
  actions: [],
});

export default createDraftAutomationRule;
