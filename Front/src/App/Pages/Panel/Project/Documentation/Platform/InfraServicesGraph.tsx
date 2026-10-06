import {useCallback, useState} from 'react';
import {ArrowLeft, Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {GraphEditor} from '@/components/GraphEditor';
import type {GraphEdgeData, GraphNodeData} from '@/components/GraphEditor';
import DocEntityPanel from './DocEntityPanel';
import {removeInfraService} from './cascade';
import type {InfraCluster, InfraService, PlatformDocumentation} from '@/lib/Project/Type/types';

type InfraServicesGraphProps = {
  cluster: InfraCluster;
  platformDocumentation: PlatformDocumentation;
  onChange: (platformDocumentation: PlatformDocumentation) => void;
  onBack: () => void;
};

const DEFAULT_COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#f97316', '#34d399', '#facc15'];

const createService = (clusterId: string, index: number): InfraService => ({
  id: crypto.randomUUID(),
  name: 'New service',
  color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  clusterId,
});

// Terminal level of the infrastructure drill-down (cluster -> services) -
// services/queues/databases within a cluster, all as one node type.
const InfraServicesGraph = ({cluster, platformDocumentation, onChange, onBack}: InfraServicesGraphProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const services = platformDocumentation.infraServices.filter((service) => service.clusterId === cluster.id);
  const serviceIds = new Set(services.map((service) => service.id));

  const graphNodes: GraphNodeData[] = services.map((service) => ({
    id: service.id,
    label: service.name,
    color: service.color,
  }));

  const graphEdges: GraphEdgeData[] = platformDocumentation.infraServiceEdges
    .filter((edge) => serviceIds.has(edge.source) && serviceIds.has(edge.target))
    .map((edge) => ({id: edge.id, source: edge.source, target: edge.target, label: edge.label}));

  const handleAdd = useCallback(() => {
    const service = createService(cluster.id, services.length);
    onChange({...platformDocumentation, infraServices: [...platformDocumentation.infraServices, service]});
    setSelectedId(service.id);
  }, [cluster.id, services.length, platformDocumentation, onChange]);

  const handleConnect = useCallback(
    ({source, target}: {source: string; target: string}) => {
      const id = `${source}->${target}`;
      if (platformDocumentation.infraServiceEdges.some((edge) => edge.id === id)) return;
      onChange({
        ...platformDocumentation,
        infraServiceEdges: [...platformDocumentation.infraServiceEdges, {id, source, target}],
      });
    },
    [platformDocumentation, onChange],
  );

  const handleEdgeRemove = useCallback(
    (edgeId: string) => {
      onChange({
        ...platformDocumentation,
        infraServiceEdges: platformDocumentation.infraServiceEdges.filter((edge) => edge.id !== edgeId),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleEdgeLabelChange = useCallback(
    (edgeId: string, label: string) => {
      onChange({
        ...platformDocumentation,
        infraServiceEdges: platformDocumentation.infraServiceEdges.map((edge) =>
          edge.id === edgeId ? {...edge, label} : edge,
        ),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleUpdate = useCallback(
    (updated: InfraService) => {
      onChange({
        ...platformDocumentation,
        infraServices: platformDocumentation.infraServices.map((service) =>
          service.id === updated.id ? updated : service,
        ),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(removeInfraService(platformDocumentation, id));
      setSelectedId(null);
    },
    [platformDocumentation, onChange],
  );

  const selectedService = services.find((service) => service.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Clusters
      </button>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Services — {cluster.name}</p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          Add service
        </Button>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">No services yet in this cluster.</p>
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

          {selectedService && (
            <DocEntityPanel
              label="Service"
              entity={selectedService}
              onChange={handleUpdate}
              onClose={() => setSelectedId(null)}
              onDelete={() => handleDelete(selectedService.id)}
              deleteLabel="Delete service"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default InfraServicesGraph;
