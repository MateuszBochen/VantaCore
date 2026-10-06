import {useCallback, useState} from 'react';
import {Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {GraphEditor} from '@/components/GraphEditor';
import type {GraphEdgeData, GraphNodeData} from '@/components/GraphEditor';
import DocEntityPanel from './DocEntityPanel';
import {removeInfraCluster} from './cascade';
import type {InfraCluster, PlatformDocumentation} from '@/lib/Project/Type/types';

type InfraClustersGraphProps = {
  platformDocumentation: PlatformDocumentation;
  onChange: (platformDocumentation: PlatformDocumentation) => void;
  onOpenCluster: (clusterId: string) => void;
};

const DEFAULT_COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#f97316', '#34d399', '#facc15'];

const createCluster = (index: number): InfraCluster => ({
  id: crypto.randomUUID(),
  name: 'New cluster',
  color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
});

const InfraClustersGraph = ({platformDocumentation, onChange, onOpenCluster}: InfraClustersGraphProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const graphNodes: GraphNodeData[] = platformDocumentation.infraClusters.map((cluster) => ({
    id: cluster.id,
    label: cluster.name,
    color: cluster.color,
  }));

  const graphEdges: GraphEdgeData[] = platformDocumentation.infraClusterEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
  }));

  const handleAdd = useCallback(() => {
    const cluster = createCluster(platformDocumentation.infraClusters.length);
    onChange({...platformDocumentation, infraClusters: [...platformDocumentation.infraClusters, cluster]});
    setSelectedId(cluster.id);
  }, [platformDocumentation, onChange]);

  const handleConnect = useCallback(
    ({source, target}: {source: string; target: string}) => {
      const id = `${source}->${target}`;
      if (platformDocumentation.infraClusterEdges.some((edge) => edge.id === id)) return;
      onChange({
        ...platformDocumentation,
        infraClusterEdges: [...platformDocumentation.infraClusterEdges, {id, source, target}],
      });
    },
    [platformDocumentation, onChange],
  );

  const handleEdgeRemove = useCallback(
    (edgeId: string) => {
      onChange({
        ...platformDocumentation,
        infraClusterEdges: platformDocumentation.infraClusterEdges.filter((edge) => edge.id !== edgeId),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleEdgeLabelChange = useCallback(
    (edgeId: string, label: string) => {
      onChange({
        ...platformDocumentation,
        infraClusterEdges: platformDocumentation.infraClusterEdges.map((edge) =>
          edge.id === edgeId ? {...edge, label} : edge,
        ),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleUpdate = useCallback(
    (updated: InfraCluster) => {
      onChange({
        ...platformDocumentation,
        infraClusters: platformDocumentation.infraClusters.map((cluster) =>
          cluster.id === updated.id ? updated : cluster,
        ),
      });
    },
    [platformDocumentation, onChange],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(removeInfraCluster(platformDocumentation, id));
      setSelectedId(null);
    },
    [platformDocumentation, onChange],
  );

  const selectedCluster = platformDocumentation.infraClusters.find((cluster) => cluster.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Clusters</p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          Add cluster
        </Button>
      </div>

      {platformDocumentation.infraClusters.length === 0 ? (
        <p className="text-sm text-muted-foreground">No clusters yet.</p>
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

          {selectedCluster && (
            <DocEntityPanel
              label="Cluster"
              entity={selectedCluster}
              onChange={handleUpdate}
              onClose={() => setSelectedId(null)}
              onDelete={() => handleDelete(selectedCluster.id)}
              deleteLabel="Delete cluster"
              descend={{label: 'Open services', onClick: () => onOpenCluster(selectedCluster.id)}}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default InfraClustersGraph;
