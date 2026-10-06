import {Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Select} from '@/components/ui/select';
import {Combobox} from '@/components/ui/combobox';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import {buildStatusOptions} from './fieldOptions';
import type {AutomationAction, AutomationActionType} from '@/lib/Automation/Type/types';
import type {Project} from '@/lib/Project/Type/types';
import type {UserSummary} from '@/lib/User/Type/types';

type ActionsStepProps = {
  project: Project;
  users: UserSummary[];
  actions: AutomationAction[];
  onChange: (actions: AutomationAction[]) => void;
};

const ACTION_OPTIONS: {value: AutomationActionType; label: string}[] = [
  {value: 'SET_STATUS', label: 'Set status'},
  {value: 'ASSIGN_USER', label: 'Assign user'},
  {value: 'ADD_COMMENT', label: 'Add comment'},
  {value: 'SET_FIELD_VALUE', label: 'Set field value'},
  {value: 'SEND_NOTIFICATION', label: 'Send notification'},
  {value: 'ASSIGN_NEXT_VERSION', label: 'Assign to next version'},
];

const createAction = (): AutomationAction => ({id: crypto.randomUUID(), type: 'SET_STATUS', params: {}});

const ActionsStep = ({project, users, actions, onChange}: ActionsStepProps) => {
  const statusOptions = buildStatusOptions(project);
  const fieldOptions = project.customFieldDefinitions.map((field) => ({value: field.id, label: field.name}));
  // Same picker (Combobox with avatars) as every other user field in this
  // app, e.g. TicketFieldsSidebar's Assignees - a plain Select here looked
  // and behaved differently from that established convention.
  const userOptions = users.map((user) => ({value: user.id, label: getUserDisplayName(user), avatarUrl: user.avatarUrl}));

  const updateAction = (id: string, patch: Partial<AutomationAction>) =>
    onChange(actions.map((action) => (action.id === id ? {...action, ...patch} : action)));

  const updateParam = (action: AutomationAction, key: string, value: string) =>
    updateAction(action.id, {params: {...action.params, [key]: value}});

  return (
    <div className="flex flex-col gap-4">
      {actions.length === 0 && <p className="text-sm text-muted-foreground">No actions yet — add at least one.</p>}

      {actions.map((action) => {
        const selectedField = project.customFieldDefinitions.find((field) => field.id === action.params.fieldId);
        const selectedFieldOptions =
          selectedField?.type === 'select'
            ? (selectedField.options ?? []).filter((option) => option.trim() !== '').map((option) => ({value: option, label: option}))
            : null;

        return (
          <div key={action.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <Select
                className="max-w-56"
                value={action.type}
                onValueChange={(value) => updateAction(action.id, {type: value as AutomationActionType, params: {}})}
                options={ACTION_OPTIONS}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onChange(actions.filter((a) => a.id !== action.id))}
                className="ml-auto text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {action.type === 'SET_STATUS' && (
              <Select
                value={action.params.statusId ?? ''}
                onValueChange={(value) => updateParam(action, 'statusId', value)}
                options={statusOptions}
                placeholder="Status"
              />
            )}

            {action.type === 'ASSIGN_USER' && (
              <Combobox
                value={action.params.userId ?? ''}
                onValueChange={(value) => updateParam(action, 'userId', value)}
                options={userOptions}
                placeholder="User"
              />
            )}

            {action.type === 'ADD_COMMENT' && (
              <Textarea
                rows={2}
                placeholder="Comment body"
                value={action.params.body ?? ''}
                onChange={(event) => updateParam(action, 'body', event.target.value)}
              />
            )}

            {action.type === 'SET_FIELD_VALUE' && (
              <div className="flex items-center gap-2">
                <Select
                  className="max-w-56"
                  value={action.params.fieldId ?? ''}
                  onValueChange={(value) => updateAction(action.id, {params: {fieldId: value, value: ''}})}
                  options={fieldOptions}
                  placeholder="Field"
                />
                {selectedFieldOptions ? (
                  <Select
                    value={action.params.value ?? ''}
                    onValueChange={(value) => updateParam(action, 'value', value)}
                    options={selectedFieldOptions}
                    placeholder="Value"
                  />
                ) : (
                  <Input
                    placeholder="Value"
                    value={action.params.value ?? ''}
                    onChange={(event) => updateParam(action, 'value', event.target.value)}
                  />
                )}
              </div>
            )}

            {action.type === 'SEND_NOTIFICATION' && (
              <Textarea
                rows={2}
                placeholder="Notification message"
                value={action.params.message ?? ''}
                onChange={(event) => updateParam(action, 'message', event.target.value)}
              />
            )}

            {action.type === 'ASSIGN_NEXT_VERSION' && (
              <p className="text-xs text-muted-foreground">
                Adds this ticket to the project's next planned version (the Version Tracker release with status
                "Plan" and the earliest planned date) — does nothing if there isn't one. No configuration needed.
              </p>
            )}
          </div>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() => onChange([...actions, createAction()])}
        className="w-fit"
      >
        Add action
      </Button>
    </div>
  );
};

export default ActionsStep;
