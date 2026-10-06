import type {StepperStep} from '@/components/ui/Stepper';

export type ProjectSettingsStepId =
  | 'basics'
  | 'statuses'
  | 'issueTypes'
  | 'hierarchy'
  | 'automation'
  | 'automationRules'
  | 'flags'
  | 'customFields'
  | 'importExport'
  | 'vcsIntegration'
  | 'webhooks';

export const PROJECT_SETTINGS_STEPS: StepperStep[] = [
  {id: 'basics', label: 'Basics'},
  // Comes before Issue Types deliberately - statuses are the shared pool
  // every issue type's Workflow step picks from (see the Status & Workflow
  // Model sub-project), so there needs to be something to pick before that
  // step is useful.
  {id: 'statuses', label: 'Statuses'},
  {id: 'issueTypes', label: 'Issue Types'},
  {id: 'hierarchy', label: 'Hierarchy'},
  {id: 'automation', label: 'Automation'},
  {id: 'automationRules', label: 'Automation Rules'},
  {id: 'flags', label: 'Flags'},
  {id: 'customFields', label: 'Custom Fields'},
  {id: 'importExport', label: 'Import / Export'},
  {id: 'vcsIntegration', label: 'Git / VCS Integration'},
  {id: 'webhooks', label: 'Webhooks'},
];

const STEP_IDS = PROJECT_SETTINGS_STEPS.map((step) => step.id as ProjectSettingsStepId);

// The Stepper displays 1-based step numbers, and the URL mirrors that
// (?step=1..7) so a step can be linked/bookmarked/refreshed without falling
// back to the first tab.
export const projectSettingsStepIdToParam = (id: ProjectSettingsStepId): string => String(STEP_IDS.indexOf(id) + 1);

export const projectSettingsStepIdFromParam = (value: string | null): ProjectSettingsStepId =>
  STEP_IDS[Number(value) - 1] ?? 'basics';
