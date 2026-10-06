import type {AuditLogEntry} from '@/lib/AuditLog/Type/types';

// Best-effort - `resourceType` isn't a confirmed enum yet (backend for this
// sub-project doesn't exist), so this only recognizes the handful of values
// that map onto an existing route and falls back to `null` (render plain
// text, not a broken link) for anything else, same "don't guess a link you
// can't back up" convention AskAiPage's own buildSourceLink follows.
const buildAuditResourceLink = (projectId: string, entry: AuditLogEntry): string | null => {
  switch (entry.resourceType.toUpperCase()) {
    case 'TICKET':
      return `/projects/${projectId}/tickets/${entry.resourceId}`;
    case 'SUB_PROJECT':
      return `/projects/${projectId}/documentation/sub-projects/${entry.resourceId}`;
    case 'AUTOMATION_RULE':
      return `/projects/${projectId}/automation-rules/${entry.resourceId}`;
    case 'PROJECT':
      return `/projects/${entry.resourceId}`;
    default:
      return null;
  }
};

export default buildAuditResourceLink;
