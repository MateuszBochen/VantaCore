import {useMemo} from 'react';
import {Upload} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Combobox} from '@/components/ui/combobox';
import importTargetFieldLabel from '@/lib/ImportExport/importTargetFieldLabel';
import type {ImportFieldMapping, ImportPreview, ImportProvider, ImportValueMapping} from '@/lib/ImportExport/Type/types';
import type {Project} from '@/lib/Project/Type/types';

type PreviewStepProps = {
  project: Project;
  provider: ImportProvider;
  preview: ImportPreview;
  mapping: ImportFieldMapping[];
  valueMappings: ImportValueMapping[];
  onValueMappingsChange: (valueMappings: ImportValueMapping[]) => void;
  onBack: () => void;
  onStartImport: () => void;
  starting: boolean;
};

// Distinct raw values found in the preview rows for whichever source field
// is mapped to `targetField` - each one needs to be resolved to a real
// IssueType/Status id below before the import can create tickets with it
// (see the sub-project's Scope: "map Jira issue types/statuses/fields to
// VantaCore's"). This is a *value* mapping, separate from MapFieldsStep's
// column mapping.
const distinctValuesFor = (preview: ImportPreview, mapping: ImportFieldMapping[], targetField: 'issueType' | 'status'): string[] => {
  const sourceField = mapping.find((entry) => entry.targetField === targetField)?.sourceField;
  if (!sourceField) {
    return [];
  }

  // Prefer the full value list from the API; preview rows only cover the first few tickets.
  const allValues = preview.fieldValues?.[sourceField];
  if (allValues && allValues.length > 0) {
    return allValues;
  }

  return Array.from(new Set(preview.rows.map((row) => row[sourceField]).filter((value): value is string => Boolean(value))));
};

const PreviewStep = ({
  project,
  provider,
  preview,
  mapping,
  valueMappings,
  onValueMappingsChange,
  onBack,
  onStartImport,
  starting,
}: PreviewStepProps) => {
  const issueTypeValues = useMemo(() => distinctValuesFor(preview, mapping, 'issueType'), [preview, mapping]);
  const statusValues = useMemo(() => distinctValuesFor(preview, mapping, 'status'), [preview, mapping]);

  const handleMapValue = (sourceValue: string, targetId: string) => {
    const withoutValue = valueMappings.filter((entry) => entry.sourceValue !== sourceValue);
    onValueMappingsChange(targetId ? [...withoutValue, {sourceValue, targetId}] : withoutValue);
  };

  const mappedFieldLabels = mapping.map((entry) => ({targetField: entry.targetField, label: importTargetFieldLabel(entry.targetField, project)}));

  return (
    <div className="flex flex-col gap-4">
      {(issueTypeValues.length > 0 || statusValues.length > 0) && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Value mapping</p>

          {issueTypeValues.map((value) => (
            <div key={`issueType:${value}`} className="grid grid-cols-2 items-center gap-4">
              <span className="text-sm text-foreground">
                Issue Type <span className="text-muted-foreground">"{value}"</span>
              </span>
              <Combobox
                className="w-56"
                value={valueMappings.find((entry) => entry.sourceValue === value)?.targetId ?? ''}
                onValueChange={(next) => handleMapValue(value, next)}
                options={project.issueTypes.map((type) => ({value: type.id, label: type.name}))}
                placeholder="Not mapped — row will be skipped"
              />
            </div>
          ))}

          {statusValues.map((value) => (
            <div key={`status:${value}`} className="grid grid-cols-2 items-center gap-4">
              <span className="text-sm text-foreground">
                Status <span className="text-muted-foreground">"{value}"</span>
              </span>
              <Combobox
                className="w-56"
                value={valueMappings.find((entry) => entry.sourceValue === value)?.targetId ?? ''}
                onValueChange={(next) => handleMapValue(value, next)}
                options={project.statuses.map((status) => ({value: status.id, label: status.name}))}
                placeholder="Uses the issue type's initial status"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Preview — first {preview.rows.length} rows</p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-xs uppercase tracking-widest text-muted-foreground">
                {mappedFieldLabels.map(({targetField, label}) => (
                  <th key={targetField} className="px-3 py-2 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  {mapping.map((entry) => (
                    <td key={entry.targetField} className="truncate px-3 py-2 text-foreground">
                      {row[entry.sourceField] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {provider !== 'CSV' && (
        <p className="text-xs text-muted-foreground">
          Attachments on each {provider === 'JIRA' ? 'issue' : 'work item'} will be migrated automatically — no mapping needed for those.
        </p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button leftIcon={<Upload className="h-4 w-4" />} onClick={onStartImport} loading={starting}>
          Start import
        </Button>
      </div>
    </div>
  );
};

export default PreviewStep;
