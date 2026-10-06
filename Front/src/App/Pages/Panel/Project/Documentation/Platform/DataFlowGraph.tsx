import {useCallback, useState} from 'react';
import {ArrowLeft, Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {GraphEditor} from '@/components/GraphEditor';
import type {GraphEdgeData, GraphNodeData} from '@/components/GraphEditor';
import DocEntityPanel from './DocEntityPanel';
import {removeDataFlowNode} from './cascade';
import type {Component, DataFlowNode, PlatformDocumentation} from '@/lib/Project/Type/types';

type DataFlowGraphProps = {
  component: Component;
  platformDocumentation: PlatformDocumentation;
  onChange: (platformDocumentation: PlatformDocumentation) => void;
  onBack: () => void;
};

const DEFAULT_COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#f97316', '#34d399', '#facc15'];

const createDataFlowNode = (componentId: string, index: number): DataFlowNode => ({
  id: crypto.randomUUID(),
  name: 'New step',
  color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  componentId,
});

// Terminal level of the domains -> bounded-contexts -> components -> data-flow
// chain - unlike the levels above, nodes here don't descend any further.
const DataFlowGraph = ({component, platformDocumentation, onChange, onBack}: DataFlowGraphProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nodes = platformDocumentation.dataFlowNodes.filter((node) => node.componentId === component.id);
  const nodeIds = new Set(nodes.map((node) => node.id));

  const graphNodes: GraphNodeData[] = nodes.map((node) => ({
    id: node.id,
    label: node.name,
    color: node.color,
  }));

  const graphEdges: GraphEdgeData[] = platformDocumentation.dataFlowEdges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => ({id: edge.id, source: edge.source, target: edge.target, label: edge.label}));

  const handleAdd = useCallback(() => {
    const node = createDataFlowNode(component.id, nodes.length);
    onChange({...platformDocumentation, dataFlowNodes: [...platformDocumentation.dataFlowNodes, node]});
    setSelectedId(node.id);
  }, [component.id, nodes.length, platformDocumentation, onChange]);

  const handleConnect = useCallback(
    ({source, target}: {source: string; target: string}) => {
      const id = `${source}->${target}`;
      if (platformDocumentation.dataFlowEdges.some((edge) => edge.id === id)) return;
      onChange({
        ...platformDocumentation,
        dataFlowEdges: [...platformDocumentation.dataFlowEdges, {id, source, target}],
      });
    },
    [platformDocumentation, onChange],
  );

  const handleEdgeRemove = useCallback(
    (edgeId: string) => {
      onChange({
        ...platformDocumentation,
        dataFlowEdges: platformDocumentation.dataFlowEdges.filter((edge) => edge.id !== edgeId),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleEdgeLabelChange = useCallback(
    (edgeId: string, label: string) => {
      onChange({
        ...platformDocumentation,
        dataFlowEdges: platformDocumentation.dataFlowEdges.map((edge) =>
          edge.id === edgeId ? {...edge, label} : edge,
        ),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleUpdate = useCallback(
    (updated: DataFlowNode) => {
      onChange({
        ...platformDocumentation,
        dataFlowNodes: platformDocumentation.dataFlowNodes.map((node) =>
          node.id === updated.id ? updated : node,
        ),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(removeDataFlowNode(platformDocumentation, id));
      setSelectedId(null);
    },
    [platformDocumentation, onChange],
  );

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Components
      </button>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Data flow — {component.name}</p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          Add step
        </Button>
      </div>

      {nodes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data-flow steps yet for this component.</p>
      ) : (
        <div className="flex h-[60vh] gap-4">
          <div className="min-w-0 flex-1">
            <GraphEditor
              nodes={graphNodes}
              edges={graphEdges}
              selectedNodeId={selectedId}
              allowSelfLoop={false}
              allowCycles
              onNodeSelect={setSelectedId}
              onConnect={handleConnect}
              onEdgeRemove={handleEdgeRemove}
              onEdgeLabelChange={handleEdgeLabelChange}
            />
          </div>

          {selectedNode && (
            <DocEntityPanel
              label="Data-flow step"
              entity={selectedNode}
              onChange={handleUpdate}
              onClose={() => setSelectedId(null)}
              onDelete={() => handleDelete(selectedNode.id)}
              deleteLabel="Delete step"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DataFlowGraph;
