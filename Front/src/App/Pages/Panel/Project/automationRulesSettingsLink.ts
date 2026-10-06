import {projectSettingsStepIdToParam} from './projectSettingsSteps';

// AutomationRuleEditorPage navigates back here after Submit/Cancel -
// computed from the same step list ProjectSettings itself uses, so the two
// can't silently drift apart if a step is ever reordered.
export const automationRulesSettingsLink = (projectId: string): string =>
  `/projects/${projectId}/settings?step=${projectSettingsStepIdToParam('automationRules')}`;
