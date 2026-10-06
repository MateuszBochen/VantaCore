import {useMemo} from 'react';
import {Button} from '@/components/ui/button';
import {Combobox} from '@/components/ui/combobox';
import type {ImportFieldMapping, ImportPreview, ImportTargetField} from '@/lib/ImportExport/Type/types';
import type {Project} from '@/lib/Project/Type/types';

type MapFieldsStepProps = {
  project: Project;
  preview: ImportPreview;
  mapping: ImportFieldMapping[];
  onChange: (mapping: ImportFieldMapping[]) => void;
  onBack: () => void;
  onContinue: () => void;
};

type TargetFieldOption = {value: ImportTargetField; label: string; required?: boolean; hint?: string};

// Priority needs no value mapping in PreviewStep - the API converts the
// source text/number to a 0-4 level itself.
const BASE_TARGET_FIELDS: TargetFieldOption[] = [
  {value: 'title', label: 'Title', required: true},
  {value: 'description', label: 'Description'},
  {value: 'issueType', label: 'Issue Type'},
  {value: 'status', label: 'Status'},
  {value: 'priority', label: 'Priority', hint: 'Highest–Lowest or 0–4; unmapped = Medium'},
  {value: 'assignee', label: 'Assignee (matched by email)'},
];

const MapFieldsStep = ({project, preview, mapping, onChange, onBack, onContinue}: MapFieldsStepProps) => {
  const targetFields: TargetFieldOption[] = [
    ...BASE_TARGET_FIELDS,
    ...project.customFieldDefinitions.map((field) => ({value: `custom:${field.id}` as ImportTargetField, label: field.name})),
  ];

  // Stable identity, not just a stable dependency - shared across every row's
  // Combobox below, so it must not be a fresh array of fresh objects on every
  // keystroke in an unrelated row (see IssueTypeCard's own base-ui Select fix
  // for why an ever-changing `options` identity is worth avoiding here).
  const sourceOptions = useMemo(() => preview.fields.map((field) => ({value: field, label: field})), [preview.fields]);

  const handleMap = (targetField: ImportTargetField, sourceField: string) => {
    const withoutTarget = mapping.filter((entry) => entry.targetField !== targetField);
    onChange(sourceField ? [...withoutTarget, {sourceField, targetField}] : withoutTarget);
  };

  const titleMapped = mapping.some((entry) => entry.targetField === 'title');

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Match each VantaCore field to a column from the source. Title is required — everything else is optional. To preserve the
        original ticket number (e.g. Jira{"'"}s key), create a "Legacy key" custom field first and map it below like any other.
      </p>

      <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
        <div className="grid grid-cols-2 gap-4 px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground">
          <span>VantaCore field</span>
          <span>Source field</span>
        </div>

        {targetFields.map((target) => (
          <div key={target.value} className="grid grid-cols-2 items-center gap-4 px-4 py-2.5">
            <div className="flex flex-col">
              <span className="text-sm text-foreground">
                {target.label}
                {target.required && <span className="ml-1 text-destructive">*</span>}
              </span>
              {target.hint && <span className="text-xs text-muted-foreground">{target.hint}</span>}
            </div>
            <Combobox
              className="w-64"
              value={mapping.find((entry) => entry.targetField === target.value)?.sourceField ?? ''}
              onValueChange={(value) => handleMap(target.value, value)}
              options={sourceOptions}
              placeholder="Not mapped"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue} disabled={!titleMapped}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default MapFieldsStep;
