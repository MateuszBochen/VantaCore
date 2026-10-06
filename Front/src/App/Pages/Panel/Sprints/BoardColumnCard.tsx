import {ArrowDown, ArrowUp, ChevronDown, ChevronRight, Trash2} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import type {Project} from '@/lib/Project/Type/types';
import type {BoardColumn} from '@/lib/Board/Type/types';

type BoardColumnCardProps = {
  column: BoardColumn;
  projects: Project[];
  expanded: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggleExpand: () => void;
  onChange: (column: BoardColumn) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

// One row in BoardColumnsSection's list - same shape as IssueTypeCard
// (color swatch + name + expand-to-configure + remove), expanded panel
// lists every status of every issue type across the board's linked
// projects as a checkbox, grouped by project then issue type. Column order
// here IS the board's display order (see memory:
// project_vantacore_boards_concept), so up/down buttons let the user
// reorder them - no drag-and-drop, just swap with the adjacent column.
const BoardColumnCard = ({column, projects, expanded, canMoveUp, canMoveDown, onToggleExpand, onChange, onRemove, onMoveUp, onMoveDown}: BoardColumnCardProps) => {
  const toggleStatus = (statusId: string, checked: boolean) => {
    onChange({
      ...column,
      statusIds: checked ? [...column.statusIds, statusId] : column.statusIds.filter((id) => id !== statusId),
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 p-3">
        <Button
          variant="ghost"
          size="icon"
          disableRipple
          onClick={onToggleExpand}
          className="h-6 w-6 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <input
          type="color"
          value={column.color}
          onChange={(e) => onChange({...column, color: e.target.value})}
          className="h-8 w-8 cursor-pointer rounded border border-white/20 bg-transparent p-0"
        />

        <Input value={column.name} onChange={(e) => onChange({...column, name: e.target.value})} className="max-w-xs" />

        <span className="shrink-0 text-xs text-muted-foreground">
          {column.statusIds.length} status{column.statusIds.length === 1 ? '' : 'es'}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            disableRipple
            disabled={!canMoveUp}
            onClick={onMoveUp}
            className="h-8 w-8 min-w-0 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            disableRipple
            disabled={!canMoveDown}
            onClick={onMoveDown}
            className="h-8 w-8 min-w-0 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            disableRipple
            onClick={onRemove}
            className="h-8 w-8 min-w-0 shrink-0 text-muted-foreground hover:bg-muted hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-4 border-t border-border p-4">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading statuses…</p>
          ) : (
            // Statuses are project-level and shared now (see the Status &
            // Workflow Model sub-project) - one flat list per project, not
            // nested per issue type. Picking "Done" once now covers every
            // issue type that uses it, instead of needing "Task: Done",
            // "Bug: Done", "Story: Done" checked separately.
            projects.map((project) => (
              <div key={project.id} className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{project.name}</p>

                {project.statuses.length === 0 ? (
                  <p className="pl-2 text-xs text-muted-foreground">No statuses configured.</p>
                ) : (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pl-2">
                    {project.statuses.map((status) => (
                      <label key={status.id} className="flex items-center gap-2 text-sm text-foreground">
                        <Checkbox
                          checked={column.statusIds.includes(status.id)}
                          onCheckedChange={(checked) => toggleStatus(status.id, checked)}
                        />
                        {status.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BoardColumnCard;
