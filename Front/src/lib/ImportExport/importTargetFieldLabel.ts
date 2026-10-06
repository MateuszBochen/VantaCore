import type {ImportTargetField} from './Type/types';
import type {Project} from '@/lib/Project/Type/types';

// Every built-in target's display label - shared with MapFieldsStep so the
// same field never reads differently in two places. `custom:${id}` isn't
// here since it has no fixed label of its own - see importTargetFieldLabel
// below, which is what actually resolves it against the project's custom
// field definitions.
export const BASE_TARGET_FIELD_LABELS: Record<Exclude<ImportTargetField, `custom:${string}`>, string> = {
  title: 'Title',
  description: 'Description',
  issueType: 'Issue Type',
  status: 'Status',
  priority: 'Priority',
  assignee: 'Assignee',
};

// PreviewStep's table header was rendering the raw `targetField` value
// (`custom:d6fec82f-...`) instead of the field's name for custom fields -
// this is the single place both MapFieldsStep and PreviewStep resolve a
// targetField to what a human should actually see.
const importTargetFieldLabel = (targetField: ImportTargetField, project: Project): string => {
  if (targetField.startsWith('custom:')) {
    const customFieldId = targetField.slice('custom:'.length);
    return project.customFieldDefinitions.find((field) => field.id === customFieldId)?.name ?? targetField;
  }

  return BASE_TARGET_FIELD_LABELS[targetField as Exclude<ImportTargetField, `custom:${string}`>];
};

export default importTargetFieldLabel;
