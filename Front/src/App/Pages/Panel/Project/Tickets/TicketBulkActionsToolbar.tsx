import {useState} from 'react';
import {Check, Trash2, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select} from '@/components/ui/select';
import {Combobox} from '@/components/ui/combobox';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import useUsersHook from '@/lib/User/useUsersHook';
import useBulkUpdateTicketsHook from '@/lib/Ticket/useBulkUpdateTicketsHook';
import {toastService} from '@/lib/Toast/ToastService';
import type {TicketBulkActionResult, TicketBulkActionType} from '@/lib/Ticket/Type/types';
import type {Project} from '@/lib/Project/Type/types';

type TicketBulkActionsToolbarProps = {
  project: Project;
  selectedIds: string[];
  onClearSelection: () => void;
  // Parent refetches the list (fields like status/assignee just changed
  // server-side) and clears selection - this component only knows about the
  // ids it was given, not what the resulting ticket list should look like.
  onApplied: () => void;
};

const ACTION_OPTIONS: {value: TicketBulkActionType; label: string}[] = [
  {value: 'SET_STATUS', label: 'Set status'},
  {value: 'ASSIGN', label: 'Assign'},
  {value: 'SET_FIELD', label: 'Set field value'},
  {value: 'ADD_FLAG', label: 'Add flag'},
  {value: 'REMOVE_FLAG', label: 'Remove flag'},
  {value: 'MOVE_SUB_PROJECT', label: 'Move to sub-project'},
  {value: 'DELETE', label: 'Delete'},
];

// Statuses are project-level and shared (see the Status & Workflow Model
// sub-project) - every status in the pool, not just ones present in the
// current selection. A status that doesn't apply to a given ticket's own
// type just comes back as that one ticket's per-item failure in `results`,
// which is exactly what the partial-success response is for.
const buildStatusOptions = (project: Project) => project.statuses.map((status) => ({value: status.id, label: status.name}));

const TicketBulkActionsToolbar = ({project, selectedIds, onClearSelection, onApplied}: TicketBulkActionsToolbarProps) => {
  const {users} = useUsersHook();
  const {bulkUpdateTickets} = useBulkUpdateTicketsHook();
  const [actionType, setActionType] = useState<TicketBulkActionType>('SET_STATUS');
  const [params, setParams] = useState<Record<string, string>>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [applying, setApplying] = useState(false);
  const [lastResults, setLastResults] = useState<TicketBulkActionResult[] | null>(null);

  const statusOptions = buildStatusOptions(project);
  const userOptions = users.map((user) => ({value: user.id, label: getUserDisplayName(user), avatarUrl: user.avatarUrl}));
  const flagOptions = project.flags.map((flag) => ({value: flag.id, label: flag.name}));
  const subProjectOptions = project.subProjects.map((subProject) => ({value: subProject.id, label: subProject.name}));
  const fieldOptions = project.customFieldDefinitions.map((field) => ({value: field.id, label: field.name}));
  const selectedField = project.customFieldDefinitions.find((field) => field.id === params.fieldId);
  const selectedFieldOptions =
    selectedField?.type === 'select'
      ? (selectedField.options ?? []).filter((option) => option.trim() !== '').map((option) => ({value: option, label: option}))
      : null;

  const handleActionTypeChange = (value: string) => {
    setActionType(value as TicketBulkActionType);
    setParams({});
    setConfirmingDelete(false);
    setLastResults(null);
  };

  const isReady =
    (actionType === 'SET_STATUS' && !!params.statusId) ||
    (actionType === 'ASSIGN' && !!params.userId) ||
    (actionType === 'SET_FIELD' && !!params.fieldId && params.value !== undefined && params.value !== '') ||
    (actionType === 'ADD_FLAG' && !!params.flagId) ||
    (actionType === 'REMOVE_FLAG' && !!params.flagId) ||
    (actionType === 'MOVE_SUB_PROJECT' && !!params.subProjectId) ||
    actionType === 'DELETE';

  const handleApply = () => {
    if (actionType === 'DELETE' && !confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    setApplying(true);
    setLastResults(null);

    bulkUpdateTickets(project.id, selectedIds, {type: actionType, params})
      .then((result) => {
        if (!result.success) {
          toastService.push('error', result.message);
          return;
        }

        setLastResults(result.results);
        const failed = result.results.filter((entry) => !entry.success).length;
        const succeeded = result.results.length - failed;

        if (failed === 0) {
          toastService.push('success', `Updated ${succeeded} ticket${succeeded === 1 ? '' : 's'}.`);
          onApplied();
        } else {
          toastService.push('error', `${succeeded} succeeded, ${failed} failed — see details below.`);
        }

        setConfirmingDelete(false);
      })
      .finally(() => setApplying(false));
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-accent/40 bg-accent/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {selectedIds.length} selected
        </span>

        <Select className="max-w-56" value={actionType} onValueChange={handleActionTypeChange} options={ACTION_OPTIONS} />

        {actionType === 'SET_STATUS' && (
          <Select
            className="max-w-56"
            value={params.statusId ?? ''}
            onValueChange={(value) => setParams({statusId: value})}
            options={statusOptions}
            placeholder="Status"
          />
        )}

        {actionType === 'ASSIGN' && (
          <Combobox value={params.userId ?? ''} onValueChange={(value) => setParams({userId: value})} options={userOptions} placeholder="User" />
        )}

        {actionType === 'SET_FIELD' && (
          <>
            <Select
              className="max-w-56"
              value={params.fieldId ?? ''}
              onValueChange={(value) => setParams({fieldId: value, value: ''})}
              options={fieldOptions}
              placeholder="Field"
            />
            {selectedFieldOptions ? (
              <Select
                value={params.value ?? ''}
                onValueChange={(value) => setParams((current) => ({...current, value}))}
                options={selectedFieldOptions}
                placeholder="Value"
              />
            ) : (
              <Input
                placeholder="Value"
                value={params.value ?? ''}
                onChange={(event) => setParams((current) => ({...current, value: event.target.value}))}
                className="max-w-48"
              />
            )}
          </>
        )}

        {(actionType === 'ADD_FLAG' || actionType === 'REMOVE_FLAG') && (
          <Select
            className="max-w-56"
            value={params.flagId ?? ''}
            onValueChange={(value) => setParams({flagId: value})}
            options={flagOptions}
            placeholder="Flag"
          />
        )}

        {actionType === 'MOVE_SUB_PROJECT' && (
          <Select
            className="max-w-56"
            value={params.subProjectId ?? ''}
            onValueChange={(value) => setParams({subProjectId: value})}
            options={subProjectOptions}
            placeholder="Sub-project"
          />
        )}

        <Button
          size="sm"
          variant={actionType === 'DELETE' && confirmingDelete ? 'destructive' : 'default'}
          leftIcon={
            actionType === 'DELETE' && confirmingDelete ? (
              <Trash2 className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )
          }
          disabled={!isReady}
          loading={applying}
          onClick={handleApply}
        >
          {actionType === 'DELETE' && confirmingDelete ? 'Confirm delete?' : 'Apply'}
        </Button>

        <Button variant="ghost" size="icon" onClick={onClearSelection} className="ml-auto text-muted-foreground">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {lastResults && lastResults.some((entry) => !entry.success) && (
        <div className="flex flex-col gap-1 border-t border-border pt-2">
          {lastResults
            .filter((entry) => !entry.success)
            .map((entry) => (
              <p key={entry.ticketId} className="text-xs text-destructive">
                {entry.ticketId}: {entry.error ?? 'Failed'}
              </p>
            ))}
        </div>
      )}
    </div>
  );
};

export default TicketBulkActionsToolbar;
