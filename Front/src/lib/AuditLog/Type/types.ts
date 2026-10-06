import type {CollectionResponse} from '@/lib/Request/Type/types';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export type AuditDiffEntry = {
  before: unknown;
  after: unknown;
};

// GET /api/project/{id}/audit-log resource - per the Audit Log sub-project's
// Solution Design. `resourceType` is a free-text string, not a closed enum
// here - the backend doesn't exist yet so no value has actually been
// confirmed on the wire, unlike AuditAction (a small, deliberately-designed
// set this project's own ADR commits to).
export type AuditLogEntry = {
  id: string;
  projectId: string;
  resourceType: string;
  resourceId: string;
  action: AuditAction;
  actorId: string;
  actorEmail: string;
  occurredAt: string;
  diff: Record<string, AuditDiffEntry>;
};

export type AuditLogFilters = {
  actorId: string;
  resourceType: string;
  action: AuditAction | '';
  from: string;
  till: string;
};

export type ListAuditLogResponseItem = {id: string; resource: AuditLogEntry};

export type ListAuditLogResponse = CollectionResponse<ListAuditLogResponseItem>;

export type ListAuditLogResult = {success: true; entries: AuditLogEntry[]; total: number} | {success: false};
