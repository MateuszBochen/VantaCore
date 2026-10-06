import type {CollectionResponse} from '@/lib/Request/Type/types';

// The TICKET_*/COMMENT_ADDED triggers fire off the in-app domain event bus;
// the COMMIT_*/BRANCH_*/PULL_REQUEST_* ones fire off the inbound VCS webhook
// the Git / VCS Integration sub-project already ingests (same providers -
// GitHub/GitLab/Bitbucket/Azure DevOps - see lib/Vcs). PULL_REQUEST_MERGED
// / PULL_REQUEST_DECLINED mirror DevelopmentPullRequest.status's own
// MERGED / DECLINED values.
export type AutomationTriggerType =
  | 'TICKET_CREATED'
  | 'TICKET_STATUS_CHANGED'
  | 'TICKET_FIELD_CHANGED'
  | 'COMMENT_ADDED'
  | 'COMMIT_PUSHED'
  | 'BRANCH_CREATED'
  | 'PULL_REQUEST_OPENED'
  | 'PULL_REQUEST_MERGED'
  | 'PULL_REQUEST_DECLINED';

export type AutomationConditionOperator = 'equals' | 'notEquals' | 'in' | 'isEmpty';

export type AutomationCondition = {
  id: string;
  field: string;
  operator: AutomationConditionOperator;
  value: string;
};

// ASSIGN_NEXT_VERSION takes no params - "next version" is resolved at
// execution time (the project's earliest-plannedReleaseDate Release still
// in PLAN status, see VersionTrackerPage's own sortByPlannedDate), not a
// fixed release id chosen when the rule is authored, since which release is
// "next" changes as releases actually ship. A no-op if the project has no
// PLAN release at all - "if exist" is the point, not an error case.
export type AutomationActionType =
  | 'SET_STATUS'
  | 'ASSIGN_USER'
  | 'ADD_COMMENT'
  | 'SET_FIELD_VALUE'
  | 'SEND_NOTIFICATION'
  | 'ASSIGN_NEXT_VERSION';

export type AutomationAction = {
  id: string;
  type: AutomationActionType;
  params: Record<string, string>;
};

export type AutomationTrigger = {
  type: AutomationTriggerType;
  params: Record<string, string>;
};

// Named distinctly from Project/Type/types.ts's own `AutomationRule` (the
// existing single-purpose parent-status-sync rule, saved as part of the
// whole-project PUT via ProjectSettings) - this is the general trigger/
// condition/action engine from the "Automation Engine" sub-project, a
// separate aggregate with its own CRUD endpoints and async execution model
// (see that sub-project's Solution Design/ADR), not a replacement for the
// simpler existing feature.
export type AutomationEngineRule = {
  id: string;
  projectId: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
};

export type ListAutomationEngineRulesResponseItem = {id: string; resource: AutomationEngineRule};

// Same {meta, data: [{id, resource}]} envelope as every other list endpoint.
export type ListAutomationEngineRulesResponse = CollectionResponse<ListAutomationEngineRulesResponseItem>;

export type ListAutomationEngineRulesResult = {success: true; rules: AutomationEngineRule[]} | {success: false};

export type SaveAutomationEngineRuleResult = {success: true} | {success: false; message: string};

export type DeleteAutomationEngineRuleResult = {success: true} | {success: false; message: string};

// One row of GET /api/project/{id}/automation-rule/{ruleId}/executions -
// shape confirmed against the real backend response (2026-08-21), which
// differs from what the Solution Design sketched: `status` isn't a small
// closed enum we've fully seen yet (only "MATCHED" confirmed so far - kept
// as `string` and rendered with a raw-value fallback, same convention as
// getReleaseStatusLabel, rather than guessing at the rest of the enum and
// risking a value silently falling through). No `ticketKey` - only a raw
// `ticketId`, so the UI links to the ticket instead of showing a denormalized label.
export type AutomationActionResult = {
  actionId: string;
  type: AutomationActionType;
  success: boolean;
  error: string | null;
};

export type AutomationExecution = {
  id: string;
  ruleId: string;
  projectId: string;
  ticketId: string | null;
  triggerType: AutomationTriggerType;
  status: string;
  executedActions: AutomationActionResult[];
  // Rule-level failure (e.g. condition evaluation itself errored) - distinct
  // from a single action's own `error` in executedActions.
  errorMessage: string | null;
  // Loop-guard counter from the "async off the event bus" ADR - 0 for a
  // directly-triggered run, >0 when this execution was itself caused by
  // another automation action.
  depth: number;
  executedAt: string;
};

export type ListAutomationExecutionsResponseItem = {id: string; resource: AutomationExecution};

export type ListAutomationExecutionsResponse = CollectionResponse<ListAutomationExecutionsResponseItem>;

export type ListAutomationExecutionsResult =
  | {success: true; executions: AutomationExecution[]; total: number}
  | {success: false};
