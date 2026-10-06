import type {AutomationActionType, AutomationTriggerType} from '@/lib/Automation/Type/types';

// Shared between AutomationEngineSection (rule list) and HistoryStep
// (execution log) so the two can't drift into showing different wording for
// the same trigger/action type.
export const TRIGGER_TYPE_LABELS: Record<AutomationTriggerType, string> = {
  TICKET_CREATED: 'Ticket created',
  TICKET_STATUS_CHANGED: 'Status changed',
  TICKET_FIELD_CHANGED: 'Field changed',
  COMMENT_ADDED: 'Comment added',
  COMMIT_PUSHED: 'Commit pushed',
  BRANCH_CREATED: 'Branch created',
  PULL_REQUEST_OPENED: 'PR opened',
  PULL_REQUEST_MERGED: 'PR merged',
  PULL_REQUEST_DECLINED: 'PR declined',
};

export const ACTION_TYPE_LABELS: Record<AutomationActionType, string> = {
  SET_STATUS: 'Set status',
  ASSIGN_USER: 'Assign user',
  ADD_COMMENT: 'Add comment',
  SET_FIELD_VALUE: 'Set field value',
  SEND_NOTIFICATION: 'Send notification',
  ASSIGN_NEXT_VERSION: 'Assign to next version',
};
