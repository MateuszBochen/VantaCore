import {useCallback, useState} from 'react';
import {ArrowLeft, Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {GraphEditor} from '@/components/GraphEditor';
import type {GraphEdgeData, GraphNodeData} from '@/components/GraphEditor';
import DocEntityPanel from './DocEntityPanel';
import {removeComponent} from './cascade';
import type {BoundedContext, Component, PlatformDocumentation} from '@/lib/Project/Type/types';

type ComponentsGraphProps = {
  boundedContext: BoundedContext;
  platformDocumentation: PlatformDocumentation;
  onChange: (platformDocumentation: PlatformDocumentation) => void;
  onBack: () => void;
  onOpenComponent: (componentId: string) => void;
};

const DEFAULT_COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#f97316', '#34d399', '#facc15'];

const createComponent = (boundedContextId: string, index: number): Component => ({
  id: crypto.randomUUID(),
  name: 'New component',
  color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  boundedContextId,
});

const ComponentsGraph = ({
  boundedContext,
  platformDocumentation,
  onChange,
  onBack,
  onOpenComponent,
}: ComponentsGraphProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const components = platformDocumentation.components.filter(
    (component) => component.boundedContextId === boundedContext.id,
  );
  const componentIds = new Set(components.map((component) => component.id));

  const graphNodes: GraphNodeData[] = components.map((component) => ({
    id: component.id,
    label: component.name,
    color: component.color,
  }));

  const graphEdges: GraphEdgeData[] = platformDocumentation.componentEdges
    .filter((edge) => componentIds.has(edge.source) && componentIds.has(edge.target))
    .map((edge) => ({id: edge.id, source: edge.source, target: edge.target, label: edge.label}));

  const handleAdd = useCallback(() => {
    const component = createComponent(boundedContext.id, components.length);
    onChange({...platformDocumentation, components: [...platformDocumentation.components, component]});
    setSelectedId(component.id);
  }, [boundedContext.id, components.length, platformDocumentation, onChange]);

  const handleConnect = useCallback(
    ({source, target}: {source: string; target: string}) => {
      const id = `${source}->${target}`;
      if (platformDocumentation.componentEdges.some((edge) => edge.id === id)) return;
      onChange({
        ...platformDocumentation,
        componentEdges: [...platformDocumentation.componentEdges, {id, source, target}],
      });
    },
    [platformDocumentation, onChange],
  );

  const handleEdgeRemove = useCallback(
    (edgeId: string) => {
      onChange({
        ...platformDocumentation,
        componentEdges: platformDocumentation.componentEdges.filter((edge) => edge.id !== edgeId),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleEdgeLabelChange = useCallback(
    (edgeId: string, label: string) => {
      onChange({
        ...platformDocumentation,
        componentEdges: platformDocumentation.componentEdges.map((edge) =>
          edge.id === edgeId ? {...edge, label} : edge,
        ),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleUpdate = useCallback(
    (updated: Component) => {
      onChange({
        ...platformDocumentation,
        components: platformDocumentation.components.map((component) =>
          component.id === updated.id ? updated : component,
        ),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(removeComponent(platformDocumentation, id));
      setSelectedId(null);
    },
    [platformDocumentation, onChange],
  );

  const selectedComponent = components.find((component) => component.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Bounded contexts
      </button>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Components — {boundedContext.name}</p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          Add component
        </Button>
      </div>

      {components.length === 0 ? (
        <p className="text-sm text-muted-foreground">No components yet in this bounded context.</p>
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

          {selectedComponent && (
            <DocEntityPanel
              label="Component"
              entity={selectedComponent}
              onChange={handleUpdate}
              onClose={() => setSelectedId(null)}
              onDelete={() => handleDelete(selectedComponent.id)}
              deleteLabel="Delete component"
              descend={{label: 'Open data flow', onClick: () => onOpenComponent(selectedComponent.id)}}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ComponentsGraph;
