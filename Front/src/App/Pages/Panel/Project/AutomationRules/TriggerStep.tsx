import {Select} from '@/components/ui/select';
import {buildStatusOptions} from './fieldOptions';
import type {AutomationTrigger, AutomationTriggerType} from '@/lib/Automation/Type/types';
import type {Project} from '@/lib/Project/Type/types';

type TriggerStepProps = {
  project: Project;
  trigger: AutomationTrigger;
  onChange: (trigger: AutomationTrigger) => void;
};

const TRIGGER_OPTIONS: {value: AutomationTriggerType; label: string}[] = [
  {value: 'TICKET_CREATED', label: 'Ticket created'},
  {value: 'TICKET_STATUS_CHANGED', label: 'Ticket status changed'},
  {value: 'TICKET_FIELD_CHANGED', label: 'Ticket field changed'},
  {value: 'COMMENT_ADDED', label: 'Comment added'},
  {value: 'COMMIT_PUSHED', label: 'Commit pushed'},
  {value: 'BRANCH_CREATED', label: 'Branch created'},
  {value: 'PULL_REQUEST_OPENED', label: 'Pull request opened'},
  {value: 'PULL_REQUEST_MERGED', label: 'Pull request merged'},
  {value: 'PULL_REQUEST_DECLINED', label: 'Pull request declined'},
];

const TriggerStep = ({project, trigger, onChange}: TriggerStepProps) => {
  const statusOptions = buildStatusOptions(project);
  const fieldOptions = project.customFieldDefinitions.map((field) => ({value: field.id, label: field.name}));

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">When</p>
        <Select
          value={trigger.type}
          onValueChange={(value) => onChange({type: value as AutomationTriggerType, params: {}})}
          options={TRIGGER_OPTIONS}
        />
      </div>

      {trigger.type === 'TICKET_STATUS_CHANGED' && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">To status</p>
          <Select
            value={trigger.params.toStatusId ?? ''}
            onValueChange={(value) => onChange({...trigger, params: {...trigger.params, toStatusId: value}})}
            options={statusOptions}
            placeholder="Any status"
          />
        </div>
      )}

      {trigger.type === 'TICKET_FIELD_CHANGED' && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Field</p>
          <Select
            value={trigger.params.fieldId ?? ''}
            onValueChange={(value) => onChange({...trigger, params: {...trigger.params, fieldId: value}})}
            options={fieldOptions}
            placeholder="Any field"
          />
        </div>
      )}
    </div>
  );
};

export default TriggerStep;
