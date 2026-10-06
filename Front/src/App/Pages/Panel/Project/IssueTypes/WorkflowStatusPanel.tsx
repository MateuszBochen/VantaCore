import {Star, Unlink, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Surface} from '@/components/ui/surface';
import type {Status} from '@/lib/Project/Type/types';

type WorkflowStatusPanelProps = {
  status: Status;
  isInitial: boolean;
  onSetInitial: () => void;
  onRemove: () => void;
  onClose: () => void;
};

// Read-only identity (name/color/isDone) - editing those now happens once,
// project-wide, in the Statuses step (see StatusesSection), not per issue
// type here. This panel only has workflow-specific actions: which shared
// status is this type's initial one, and un-linking a status from this
// type's workflow (not deleting the shared status itself - see onRemove).
const WorkflowStatusPanel = ({status, isInitial, onSetInitial, onRemove, onClose}: WorkflowStatusPanelProps) => (
  <Surface className="flex w-80 shrink-0 flex-col gap-4 p-4">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Status</p>
      <button type="button" onClick={onClose} className="text-muted-foreground hover:text-muted-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>

    <div className="flex items-center gap-2">
      <span className="h-4 w-4 shrink-0 rounded-full" style={{backgroundColor: status.color}} />
      <p className="font-medium text-foreground">{status.name}</p>
    </div>

    {status.isDone && <p className="text-xs text-muted-foreground">Marks the ticket as done.</p>}

    <Button
      size="sm"
      variant={isInitial ? 'default' : 'outline'}
      leftIcon={<Star className="h-4 w-4" />}
      onClick={onSetInitial}
      disabled={isInitial}
    >
      {isInitial ? 'Initial status' : 'Set as initial status'}
    </Button>

    <Button
      size="sm"
      variant="ghost"
      leftIcon={<Unlink className="h-4 w-4" />}
      onClick={onRemove}
      className="text-red-400 hover:text-red-300"
    >
      Remove from this workflow
    </Button>
  </Surface>
);

export default WorkflowStatusPanel;
