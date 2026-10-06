import {PRIORITIES} from '@/lib/Ticket/Type/types';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import type {Project} from '@/lib/Project/Type/types';
import type {UserSummary} from '@/lib/User/Type/types';

// Diff entries carry raw ids (statusId, assigneeIds, ...) - exactly what the
// backend should send (the point of a diff is the field that actually
// changed, not a denormalized label), but a bare uuid means nothing to a
// human reading the log. Resolves against data the page already has loaded
// (project.issueTypes/subProjects/flags, the user directory) - falls back
// to the raw value for any field/id it doesn't recognize, same "don't hide
// unrecognized data" convention as getReleaseStatusLabel.
const FIELD_LABELS: Record<string, string> = {
  statusId: 'Status',
  issueTypeId: 'Issue type',
  subProjectId: 'Sub-project',
  priority: 'Priority',
  assigneeIds: 'Assignees',
  flagIds: 'Flags',
  title: 'Title',
  description: 'Description',
  estimate: 'Estimate',
  parentId: 'Parent ticket',
};

export const formatAuditFieldLabel = (field: string): string => FIELD_LABELS[field] ?? field;

export const formatAuditFieldValue = (project: Project, users: UserSummary[], field: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '(none)';
  }

  if (field === 'statusId' && typeof value === 'string') {
    return project.statuses.find((status) => status.id === value)?.name ?? value;
  }

  if (field === 'issueTypeId' && typeof value === 'string') {
    return project.issueTypes.find((type) => type.id === value)?.name ?? value;
  }

  if (field === 'subProjectId' && typeof value === 'string') {
    return project.subProjects.find((subProject) => subProject.id === value)?.name ?? value;
  }

  if (field === 'priority' && typeof value === 'number') {
    return PRIORITIES.find((priority) => priority.level === value)?.name ?? String(value);
  }

  if (field === 'assigneeIds' && Array.isArray(value)) {
    const names = value
      .map((id) => users.find((user) => user.id === id))
      .filter((user): user is UserSummary => !!user)
      .map(getUserDisplayName);
    return names.length > 0 ? names.join(', ') : '(none)';
  }

  if (field === 'flagIds' && Array.isArray(value)) {
    const names = value.map((id) => project.flags.find((flag) => flag.id === id)?.name ?? id);
    return names.length > 0 ? names.join(', ') : '(none)';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
};
