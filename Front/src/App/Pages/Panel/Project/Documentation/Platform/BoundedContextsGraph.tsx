import {useCallback, useState} from 'react';
import {ArrowLeft, Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {GraphEditor} from '@/components/GraphEditor';
import type {GraphEdgeData, GraphNodeData} from '@/components/GraphEditor';
import DocEntityPanel from './DocEntityPanel';
import {removeBoundedContext} from './cascade';
import type {BoundedContext, Domain, PlatformDocumentation} from '@/lib/Project/Type/types';

type BoundedContextsGraphProps = {
  domain: Domain;
  platformDocumentation: PlatformDocumentation;
  onChange: (platformDocumentation: PlatformDocumentation) => void;
  onBack: () => void;
  onOpenContext: (contextId: string) => void;
};

const DEFAULT_COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#f97316', '#34d399', '#facc15'];

const createBoundedContext = (domainId: string, index: number): BoundedContext => ({
  id: crypto.randomUUID(),
  name: 'New bounded context',
  color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  domainId,
});

const BoundedContextsGraph = ({domain, platformDocumentation, onChange, onBack, onOpenContext}: BoundedContextsGraphProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const contexts = platformDocumentation.boundedContexts.filter((context) => context.domainId === domain.id);
  const contextIds = new Set(contexts.map((context) => context.id));

  const graphNodes: GraphNodeData[] = contexts.map((context) => ({
    id: context.id,
    label: context.name,
    color: context.color,
  }));

  const graphEdges: GraphEdgeData[] = platformDocumentation.boundedContextEdges
    .filter((edge) => contextIds.has(edge.source) && contextIds.has(edge.target))
    .map((edge) => ({id: edge.id, source: edge.source, target: edge.target, label: edge.label}));

  const handleAdd = useCallback(() => {
    const context = createBoundedContext(domain.id, contexts.length);
    onChange({...platformDocumentation, boundedContexts: [...platformDocumentation.boundedContexts, context]});
    setSelectedId(context.id);
  }, [domain.id, contexts.length, platformDocumentation, onChange]);

  const handleConnect = useCallback(
    ({source, target}: {source: string; target: string}) => {
      const id = `${source}->${target}`;
      if (platformDocumentation.boundedContextEdges.some((edge) => edge.id === id)) return;
      onChange({
        ...platformDocumentation,
        boundedContextEdges: [...platformDocumentation.boundedContextEdges, {id, source, target}],
      });
    },
    [platformDocumentation, onChange],
  );

  const handleEdgeRemove = useCallback(
    (edgeId: string) => {
      onChange({
        ...platformDocumentation,
        boundedContextEdges: platformDocumentation.boundedContextEdges.filter((edge) => edge.id !== edgeId),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleEdgeLabelChange = useCallback(
    (edgeId: string, label: string) => {
      onChange({
        ...platformDocumentation,
        boundedContextEdges: platformDocumentation.boundedContextEdges.map((edge) =>
          edge.id === edgeId ? {...edge, label} : edge,
        ),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleUpdate = useCallback(
    (updated: BoundedContext) => {
      onChange({
        ...platformDocumentation,
        boundedContexts: platformDocumentation.boundedContexts.map((context) =>
          context.id === updated.id ? updated : context,
        ),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(removeBoundedContext(platformDocumentation, id));
      setSelectedId(null);
    },
    [platformDocumentation, onChange],
  );

  const selectedContext = contexts.find((context) => context.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Domains
      </button>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Bounded contexts — {domain.name}</p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          Add bounded context
        </Button>
      </div>

      {contexts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bounded contexts yet in this domain.</p>
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

          {selectedContext && (
            <DocEntityPanel
              label="Bounded context"
              entity={selectedContext}
              onChange={handleUpdate}
              onClose={() => setSelectedId(null)}
              onDelete={() => handleDelete(selectedContext.id)}
              deleteLabel="Delete bounded context"
              descend={{label: 'Open components', onClick: () => onOpenContext(selectedContext.id)}}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default BoundedContextsGraph;
