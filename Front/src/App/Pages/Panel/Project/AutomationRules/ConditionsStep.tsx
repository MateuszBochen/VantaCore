import {Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select} from '@/components/ui/select';
import {Combobox} from '@/components/ui/combobox';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import {PRIORITIES} from '@/lib/Ticket/Type/types';
import {buildFieldOptions, buildStatusOptions} from './fieldOptions';
import type {AutomationCondition, AutomationConditionOperator} from '@/lib/Automation/Type/types';
import type {Project} from '@/lib/Project/Type/types';
import type {UserSummary} from '@/lib/User/Type/types';

type ConditionsStepProps = {
  project: Project;
  users: UserSummary[];
  conditions: AutomationCondition[];
  onChange: (conditions: AutomationCondition[]) => void;
};

const OPERATOR_OPTIONS: {value: AutomationConditionOperator; label: string}[] = [
  {value: 'equals', label: 'equals'},
  {value: 'notEquals', label: 'does not equal'},
  {value: 'in', label: 'is one of'},
  {value: 'isEmpty', label: 'is empty'},
];

const createCondition = (): AutomationCondition => ({id: crypto.randomUUID(), field: '', operator: 'equals', value: ''});

// Field is a picker (built-in ticket fields + this project's custom fields),
// not free text - and the value input adapts to whichever field is picked
// (status/priority/assignee/select-type custom fields all get their own
// picker too), so nothing here relies on someone typing an id by hand.
const ConditionsStep = ({project, users, conditions, onChange}: ConditionsStepProps) => {
  const fieldOptions = buildFieldOptions(project);
  const statusOptions = buildStatusOptions(project);
  const priorityOptions = PRIORITIES.map((priority) => ({value: String(priority.level), label: priority.name}));
  const userOptions = users.map((user) => ({value: user.id, label: getUserDisplayName(user), avatarUrl: user.avatarUrl}));

  const updateCondition = (id: string, patch: Partial<AutomationCondition>) =>
    onChange(conditions.map((condition) => (condition.id === id ? {...condition, ...patch} : condition)));

  const renderValueInput = (condition: AutomationCondition) => {
    if (condition.operator === 'isEmpty') {
      return null;
    }

    if (condition.field === 'status') {
      return (
        <Select
          className="max-w-48"
          value={condition.value}
          onValueChange={(value) => updateCondition(condition.id, {value})}
          options={statusOptions}
          placeholder="Value"
        />
      );
    }

    if (condition.field === 'priority') {
      return (
        <Select
          className="max-w-48"
          value={condition.value}
          onValueChange={(value) => updateCondition(condition.id, {value})}
          options={priorityOptions}
          placeholder="Value"
        />
      );
    }

    if (condition.field === 'assignee') {
      return (
        <Combobox
          className="max-w-48"
          value={condition.value}
          onValueChange={(value) => updateCondition(condition.id, {value})}
          options={userOptions}
          placeholder="Value"
        />
      );
    }

    const customField = project.customFieldDefinitions.find((field) => field.id === condition.field);

    if (customField?.type === 'select') {
      return (
        <Select
          className="max-w-48"
          value={condition.value}
          onValueChange={(value) => updateCondition(condition.id, {value})}
          options={(customField.options ?? [])
            .filter((option) => option.trim() !== '')
            .map((option) => ({value: option, label: option}))}
          placeholder="Value"
        />
      );
    }

    return (
      <Input
        className="max-w-48"
        placeholder="Value"
        value={condition.value}
        onChange={(event) => updateCondition(condition.id, {value: event.target.value})}
      />
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {conditions.length === 0 && (
        <p className="text-sm text-muted-foreground">No conditions — the rule runs on every matching trigger.</p>
      )}

      {conditions.map((condition) => (
        <div key={condition.id} className="flex items-center gap-2">
          <Select
            className="max-w-48"
            value={condition.field}
            onValueChange={(value) => updateCondition(condition.id, {field: value, value: ''})}
            options={fieldOptions}
            placeholder="Field"
          />
          <Select
            className="w-40"
            value={condition.operator}
            onValueChange={(value) => updateCondition(condition.id, {operator: value as AutomationConditionOperator})}
            options={OPERATOR_OPTIONS}
          />
          {renderValueInput(condition)}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(conditions.filter((c) => c.id !== condition.id))}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() => onChange([...conditions, createCondition()])}
        className="w-fit"
      >
        Add condition
      </Button>
    </div>
  );
};

export default ConditionsStep;
