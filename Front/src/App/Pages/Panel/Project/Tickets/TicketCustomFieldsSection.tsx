import {memo} from 'react';
import {Input} from '@/components/ui/input';
import {Select} from '@/components/ui/select';
import {Combobox} from '@/components/ui/combobox';
import {Checkbox} from '@/components/ui/checkbox';
import {DateInput} from '@/components/ui/date-input';
import useUsersHook from '@/lib/User/useUsersHook';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import type {Project} from '@/lib/Project/Type/types';
import type {Ticket} from '@/lib/Ticket/Type/types';

type TicketCustomFieldsSectionProps = {
  project: Project;
  ticket: Ticket;
  // A patch, not the whole next Ticket - see TicketFieldsSidebar's onChange
  // comment for why (parent merges against the latest draft, never a spread
  // of this component's own possibly-stale `ticket` prop).
  onChange: (patch: Partial<Ticket>) => void;
};

// Split out of TicketFieldsSidebar into its own sidebar face (paired with the
// Worklog stopwatch there, see TicketSidebar) - the two together were making
// the "Fields" face too tall once a project had more than a couple custom
// fields configured.
const TicketCustomFieldsSection = memo(({project, ticket, onChange}: TicketCustomFieldsSectionProps) => {
  const {users} = useUsersHook();

  if (project.customFieldDefinitions.length === 0) {
    return null;
  }

  const handleCustomFieldChange = (fieldId: string, value: unknown) => {
    onChange({customFields: {...ticket.customFields, [fieldId]: value}});
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-left text-xs uppercase tracking-widest text-muted-foreground">Custom fields</p>

      {project.customFieldDefinitions.map((field) => {
        const value = ticket.customFields[field.id];

        // Checkbox reads better as a single row (label left, control right)
        // than the label-above-control stack every other field type uses.
        if (field.type === 'checkbox') {
          return (
            <div key={field.id} className="flex items-center justify-between gap-2">
              <p className="text-left text-xs text-muted-foreground">{field.name}</p>
              <Checkbox checked={value === true} onCheckedChange={(checked) => handleCustomFieldChange(field.id, checked)} />
            </div>
          );
        }

        return (
          <div key={field.id} className="flex flex-col gap-1.5">
            <p className="text-left text-xs text-muted-foreground">{field.name}</p>

            {field.type === 'text' && (
              <Input
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              />
            )}

            {field.type === 'number' && (
              <Input
                type="number"
                value={typeof value === 'number' ? value : ''}
                onChange={(e) => handleCustomFieldChange(field.id, e.target.value === '' ? null : Number(e.target.value))}
              />
            )}

            {(field.type === 'date' || field.type === 'time' || field.type === 'dateTime') && (
              <DateInput
                type={field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'datetime-local'}
                value={typeof value === 'string' ? value : ''}
                onChange={(next) => handleCustomFieldChange(field.id, next)}
              />
            )}

            {field.type === 'user' &&
              (field.multiple ? (
                <Combobox
                  multiple
                  value={Array.isArray(value) ? (value as string[]) : []}
                  onValueChange={(next) => handleCustomFieldChange(field.id, next)}
                  placeholder="Search users…"
                  options={users.map((user) => ({value: user.id, label: getUserDisplayName(user), avatarUrl: user.avatarUrl}))}
                />
              ) : (
                <Combobox
                  value={typeof value === 'string' ? value : ''}
                  onValueChange={(next) => handleCustomFieldChange(field.id, next)}
                  placeholder="Search a user…"
                  options={users.map((user) => ({value: user.id, label: getUserDisplayName(user), avatarUrl: user.avatarUrl}))}
                />
              ))}

            {field.type === 'select' &&
              (() => {
                // Blank (never-filled-in) options in Project Settings would
                // otherwise show up here as indistinguishable empty rows -
                // worse, in multi-select every blank row shares the same ""
                // value, so picking any one of them marks all of them as
                // selected. Filter them out; they're not a real choice.
                const selectOptions = (field.options ?? [])
                  .filter((option) => option.trim() !== '')
                  .map((option) => ({value: option, label: option}));

                return field.multiple ? (
                  <Combobox
                    multiple
                    value={Array.isArray(value) ? (value as string[]) : []}
                    onValueChange={(next) => handleCustomFieldChange(field.id, next)}
                    placeholder="Select…"
                    options={selectOptions}
                  />
                ) : (
                  <Select
                    value={typeof value === 'string' ? value : ''}
                    onValueChange={(next) => handleCustomFieldChange(field.id, next)}
                    placeholder="Select…"
                    options={selectOptions}
                  />
                );
              })()}
          </div>
        );
      })}
    </div>
  );
});

TicketCustomFieldsSection.displayName = 'TicketCustomFieldsSection';

export default TicketCustomFieldsSection;
