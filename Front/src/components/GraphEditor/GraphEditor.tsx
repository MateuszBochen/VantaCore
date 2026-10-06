import {useCallback, useEffect} from 'react';
import type {MouseEvent as ReactMouseEvent} from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import type {Connection, Edge, Node} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {cn} from '@/lib/utils';
import useAppTheme from '@/lib/Theme/useAppTheme';
import GraphNode from './GraphNode';
import GraphEdge from './GraphEdge';
import SelfLoopEdge from './SelfLoopEdge';
import {layoutGraph} from './layout';
import {wouldCreateCycle} from './validation';
import type {GraphEditorProps, GraphNodeData} from './types';

const nodeTypes = {graphNode: GraphNode};
const edgeTypes = {graphEdge: GraphEdge, selfLoop: SelfLoopEdge};

type FlowNode = Node<GraphNodeData, 'graphNode'>;

const GraphEditor = ({
  nodes: dataNodes,
  edges: dataEdges,
  selectedNodeId = null,
  allowCycles,
  allowSelfLoop,
  direction = 'TB',
  onNodeSelect,
  onConnect: onConnectProp,
  onEdgeRemove,
  onEdgeLabelChange,
  onConnectionRejected,
  className,
}: GraphEditorProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  // React Flow's own dark/light mode (separate from our CSS token cascade -
  // it drives the library's OWN internal styles, e.g. the minimap/controls
  // chrome that doesn't go through our classNames) - was hardcoded to
  // 'dark' regardless of the app's theme picker. Only the Light theme wants
  // React Flow's light mode; Dark and Neon Blaster both want its dark one.
  const {theme} = useAppTheme();
  const reactFlowColorMode = theme === 'light' ? 'light' : 'dark';

  const sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;
  const targetPosition = direction === 'LR' ? Position.Left : Position.Top;

  // Re-derive the whole graph from the source-of-truth props on every data change.
  // Existing nodes keep whatever position they currently have (auto-laid-out or
  // manually dragged) for the lifetime of this editor instance - only a brand-new
  // node gets a freshly dagre-computed position, so e.g. clicking "Add status"
  // doesn't wipe out a layout the user just arranged. Nothing is persisted beyond
  // this component's session (fresh mount = fresh auto-layout).
  useEffect(() => {
    const flowEdges: Edge[] = dataEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.source === edge.target ? 'selfLoop' : 'graphEdge',
      data: {
        onRemove: onEdgeRemove ? () => onEdgeRemove(edge.id) : undefined,
        label: edge.label,
        onLabelChange: onEdgeLabelChange ? (label: string) => onEdgeLabelChange(edge.id, label) : undefined,
      },
      style: {stroke: 'color-mix(in srgb, var(--foreground) 40%, transparent)'},
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'color-mix(in srgb, var(--foreground) 50%, transparent)',
        width: 18,
        height: 18,
      },
    }));

    // Carry over each existing node's `measured` size from xyflow's own state.
    // Rebuilding a node object without it makes xyflow treat the node as
    // unmeasured again (see @xyflow/system's adoptUserNodes) - and since the
    // DOM element isn't actually resizing, the ResizeObserver never re-fires
    // to re-measure it, leaving the node permanently `visibility: hidden`.
    setNodes((previousNodes) => {
      const previousById = new Map(previousNodes.map((node) => [node.id, node]));

      const flowNodes: FlowNode[] = dataNodes.map((node) => {
        const previous = previousById.get(node.id);

        return {
          id: node.id,
          type: 'graphNode',
          data: node,
          position: {x: 0, y: 0},
          selected: node.id === selectedNodeId,
          sourcePosition,
          targetPosition,
          ...(previous?.measured ? {measured: previous.measured} : {}),
        };
      });

      const laidOut = layoutGraph(flowNodes, flowEdges, direction);

      return laidOut.map((node) => {
        const previous = previousById.get(node.id);
        return previous ? {...node, position: previous.position} : node;
      });
    });
    setEdges(flowEdges);
  }, [
    dataNodes,
    dataEdges,
    direction,
    sourcePosition,
    targetPosition,
    selectedNodeId,
    onEdgeRemove,
    onEdgeLabelChange,
    setNodes,
    setEdges,
  ]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      if (connection.source === connection.target) {
        if (!allowSelfLoop) {
          onConnectionRejected?.('self-loop');
          return;
        }
      } else if (!allowCycles && wouldCreateCycle(dataEdges, connection.source, connection.target)) {
        onConnectionRejected?.('cycle');
        return;
      }

      onConnectProp({source: connection.source, target: connection.target});
    },
    [allowSelfLoop, allowCycles, dataEdges, onConnectProp, onConnectionRejected],
  );

  const handleNodeClick = useCallback(
    (_event: ReactMouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect],
  );

  const handleEdgesDelete = useCallback(
    (removed: Edge[]) => {
      removed.forEach((edge) => onEdgeRemove?.(edge.id));
    },
    [onEdgeRemove],
  );

  return (
    <div
      className={cn(
        'h-full w-full overflow-hidden rounded-xl border border-border bg-card',
        className,
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onEdgesDelete={onEdgeRemove ? handleEdgesDelete : undefined}
        deleteKeyCode={onEdgeRemove ? ['Backspace', 'Delete'] : []}
        colorMode={reactFlowColorMode}
        fitView
        fitViewOptions={{maxZoom: 0.85}}
        proOptions={{hideAttribution: true}}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
        <Controls
          className="[&_button]:!border-border [&_button]:!bg-transparent [&_button]:!text-muted-foreground !border-border !bg-popover"
          showInteractive={false}
        />
        <MiniMap
          className="!border !border-border !bg-popover"
          maskColor="color-mix(in srgb, var(--page-background) 60%, transparent)"
          nodeColor={(node) => (node.data as GraphNodeData)?.color ?? '#888888'}
        />
      </ReactFlow>
    </div>
  );
};

export default GraphEditor;
