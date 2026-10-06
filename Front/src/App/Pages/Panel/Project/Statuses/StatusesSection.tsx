import {useCallback} from 'react';
import {Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {Surface} from '@/components/ui/surface';
import type {Status} from '@/lib/Project/Type/types';

type StatusesSectionProps = {
  statuses: Status[];
  onChange: (statuses: Status[]) => void;
};

const DEFAULT_COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#f97316', '#34d399', '#facc15'];

const createStatus = (index: number): Status => ({
  id: crypto.randomUUID(),
  name: 'New status',
  color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  isDone: false,
});

// Project-level, shared across every issue type - see the Status & Workflow
// Model sub-project. Creating/renaming/deleting a status here affects it
// everywhere it's used; each issue type's own Workflow step only picks
// which of these it uses and how they connect (see IssueTypeCard), it
// doesn't own or edit the status itself anymore.
const StatusesSection = ({statuses, onChange}: StatusesSectionProps) => {
  const handleAdd = useCallback(() => {
    onChange([...statuses, createStatus(statuses.length)]);
  }, [statuses, onChange]);

  const handleUpdate = useCallback(
    (updated: Status) => {
      onChange(statuses.map((status) => (status.id === updated.id ? updated : status)));
    },
    [statuses, onChange],
  );

  const handleRemove = useCallback(
    (id: string) => {
      onChange(statuses.filter((status) => status.id !== id));
    },
    [statuses, onChange],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Statuses</p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          Add status
        </Button>
      </div>

      {statuses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No statuses yet — add some here, then build each issue type's workflow from them in its own Workflow step.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {statuses.map((status) => (
            <Surface key={status.id} className="flex items-center gap-3 p-4">
              <input
                type="color"
                value={status.color}
                onChange={(e) => handleUpdate({...status, color: e.target.value})}
                className="h-8 w-8 cursor-pointer rounded border border-white/20 bg-transparent p-0"
              />

              <Input value={status.name} onChange={(e) => handleUpdate({...status, name: e.target.value})} className="max-w-xs" />

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={status.isDone} onCheckedChange={(isDone) => handleUpdate({...status, isDone})} />
                Marks tickets as done
              </label>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleRemove(status.id)}
                className="ml-auto h-8 w-8 text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusesSection;
