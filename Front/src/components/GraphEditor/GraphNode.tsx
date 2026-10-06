import {Handle, Position, type Node, type NodeProps} from '@xyflow/react';
import {cn} from '@/lib/utils';
import useAppTheme from '@/lib/Theme/useAppTheme';
import type {GraphNodeData} from './types';

type GraphEditorNode = Node<GraphNodeData, 'graphNode'>;

const GraphNode = ({data, selected, sourcePosition, targetPosition}: NodeProps<GraphEditorNode>) => {
  const connectableAsTarget = data.connectableAsTarget ?? true;
  const connectableAsSource = data.connectableAsSource ?? true;
  // The selected glow is Neon Blaster's own visual identity (same reasoning
  // as PrismFace's active nav item) - Light/Dark get a flat accent border
  // instead of a toned-down glow.
  const {theme} = useAppTheme();
  const isNeon = theme === 'neon-blaster';

  return (
    <div
      className={cn(
        // bg-popover, not bg-card - a graph node needs to read clearly
        // against the pannable canvas behind it, closer to an elevated
        // surface (95% opaque in neon-blaster) than a subtle inline card
        // tint (5%).
        'flex min-w-[160px] items-center gap-2 rounded-lg border bg-popover px-3 py-2.5 text-sm text-foreground shadow-lg backdrop-blur-md transition-colors',
        selected ? (isNeon ? 'border-cyan-400 shadow-[0_0_12px_-2px_rgba(34,211,238,0.5)]' : 'border-accent') : 'border-border',
      )}
    >
      <Handle
        type="target"
        position={targetPosition ?? Position.Top}
        isConnectable={connectableAsTarget}
        className={cn('!border-0 !bg-foreground/30', !connectableAsTarget && '!opacity-0')}
      />
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor: data.color}} />
      <span className="truncate font-medium">{data.label}</span>
      <Handle
        type="source"
        position={sourcePosition ?? Position.Bottom}
        isConnectable={connectableAsSource}
        className={cn('!border-0 !bg-foreground/30', !connectableAsSource && '!opacity-0')}
      />
    </div>
  );
};

export default GraphNode;
