import type {Project} from '@/lib/Project/Type/types';

export type FieldOption = {value: string; label: string};

// Synthetic keys for the built-in ticket fields that don't have their own
// CustomFieldDefinition id - kept distinct from real custom field ids
// (uuids) so callers can branch on them to pick the right *value* input
// (status/priority/assignee get their own picker, everything else falls
// back to free text or the custom field's own options).
export const BUILT_IN_CONDITION_FIELDS: FieldOption[] = [
  {value: 'title', label: 'Title'},
  {value: 'priority', label: 'Priority'},
  {value: 'status', label: 'Status'},
  {value: 'assignee', label: 'Assignee'},
];

export const buildFieldOptions = (project: Project): FieldOption[] => [
  ...BUILT_IN_CONDITION_FIELDS,
  ...project.customFieldDefinitions.map((field) => ({value: field.id, label: field.name})),
];

// Statuses are project-level and shared (see the Status & Workflow Model
// sub-project) - no more per-issue-type disambiguation needed, a status id
// means the same thing everywhere in this project now.
export const buildStatusOptions = (project: Project): FieldOption[] =>
  project.statuses.map((status) => ({value: status.id, label: status.name}));
