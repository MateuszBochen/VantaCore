import {useCallback, useState} from 'react';
import {Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {GraphEditor} from '@/components/GraphEditor';
import type {GraphEdgeData, GraphNodeData} from '@/components/GraphEditor';
import DocEntityPanel from './DocEntityPanel';
import {removeDomain} from './cascade';
import type {Domain, PlatformDocumentation} from '@/lib/Project/Type/types';

type DomainsGraphProps = {
  platformDocumentation: PlatformDocumentation;
  onChange: (platformDocumentation: PlatformDocumentation) => void;
  onOpenDomain: (domainId: string) => void;
};

const DEFAULT_COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#f97316', '#34d399', '#facc15'];

const createDomain = (index: number): Domain => ({
  id: crypto.randomUUID(),
  name: 'New domain',
  color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
});

const DomainsGraph = ({platformDocumentation, onChange, onOpenDomain}: DomainsGraphProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const graphNodes: GraphNodeData[] = platformDocumentation.domains.map((domain) => ({
    id: domain.id,
    label: domain.name,
    color: domain.color,
  }));

  const graphEdges: GraphEdgeData[] = platformDocumentation.domainEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
  }));

  const handleAdd = useCallback(() => {
    const domain = createDomain(platformDocumentation.domains.length);
    onChange({...platformDocumentation, domains: [...platformDocumentation.domains, domain]});
    setSelectedId(domain.id);
  }, [platformDocumentation, onChange]);

  const handleConnect = useCallback(
    ({source, target}: {source: string; target: string}) => {
      const id = `${source}->${target}`;
      if (platformDocumentation.domainEdges.some((edge) => edge.id === id)) return;
      onChange({...platformDocumentation, domainEdges: [...platformDocumentation.domainEdges, {id, source, target}]});
    },
    [platformDocumentation, onChange],
  );

  const handleEdgeRemove = useCallback(
    (edgeId: string) => {
      onChange({
        ...platformDocumentation,
        domainEdges: platformDocumentation.domainEdges.filter((edge) => edge.id !== edgeId),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleEdgeLabelChange = useCallback(
    (edgeId: string, label: string) => {
      onChange({
        ...platformDocumentation,
        domainEdges: platformDocumentation.domainEdges.map((edge) => (edge.id === edgeId ? {...edge, label} : edge)),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleUpdate = useCallback(
    (updated: Domain) => {
      onChange({
        ...platformDocumentation,
        domains: platformDocumentation.domains.map((domain) => (domain.id === updated.id ? updated : domain)),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(removeDomain(platformDocumentation, id));
      setSelectedId(null);
    },
    [platformDocumentation, onChange],
  );

  const selectedDomain = platformDocumentation.domains.find((domain) => domain.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Domains</p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          Add domain
        </Button>
      </div>

      {platformDocumentation.domains.length === 0 ? (
        <p className="text-sm text-muted-foreground">No domains yet.</p>
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

          {selectedDomain && (
            <DocEntityPanel
              label="Domain"
              entity={selectedDomain}
              onChange={handleUpdate}
              onClose={() => setSelectedId(null)}
              onDelete={() => handleDelete(selectedDomain.id)}
              deleteLabel="Delete domain"
              descend={{label: 'Open bounded contexts', onClick: () => onOpenDomain(selectedDomain.id)}}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DomainsGraph;
