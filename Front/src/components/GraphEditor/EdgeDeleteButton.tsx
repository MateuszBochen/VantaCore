import {EdgeLabelRenderer} from '@xyflow/react';
import {X} from 'lucide-react';

type EdgeDeleteButtonProps = {
  x: number;
  y: number;
  onRemove: () => void;
};

const EdgeDeleteButton = ({x, y, onRemove}: EdgeDeleteButtonProps) => (
  <EdgeLabelRenderer>
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onRemove();
      }}
      className="nodrag nopan pointer-events-auto absolute flex h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-muted-foreground shadow-md transition-colors hover:border-destructive/60 hover:text-destructive"
      style={{transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`}}
    >
      <X className="h-3 w-3" />
    </button>
  </EdgeLabelRenderer>
);

export default EdgeDeleteButton;
