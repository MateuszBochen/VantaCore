import {useState} from 'react';
import {EdgeLabelRenderer} from '@xyflow/react';
import {cn} from '@/lib/utils';

type EdgeLabelFieldProps = {
  x: number;
  y: number;
  label?: string;
  onChange: (label: string) => void;
};

// Click-to-edit pill for a relation type (e.g. "depends on", "publishes to") -
// sits above EdgeDeleteButton's position on the same edge, not on top of it.
const EdgeLabelField = ({x, y, label, onChange}: EdgeLabelFieldProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label ?? '');

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== (label ?? '')) onChange(trimmed);
  };

  return (
    <EdgeLabelRenderer>
      <div
        className="nodrag nopan pointer-events-auto absolute"
        style={{transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`}}
      >
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
              if (event.key === 'Escape') {
                setDraft(label ?? '');
                setEditing(false);
              }
            }}
            placeholder="relation type"
            className="h-6 w-32 rounded-full border border-accent bg-popover px-2 text-center text-xs text-foreground outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDraft(label ?? '');
              setEditing(true);
            }}
            className={cn(
              'h-6 max-w-40 truncate rounded-full border border-border bg-popover px-2 text-xs shadow-sm transition-colors hover:border-accent/60',
              label ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {label || '+ label'}
          </button>
        )}
      </div>
    </EdgeLabelRenderer>
  );
};

export default EdgeLabelField;
