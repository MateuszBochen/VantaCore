import {useSearchParams} from 'react-router-dom';
import InfraClustersGraph from './InfraClustersGraph';
import InfraServicesGraph from './InfraServicesGraph';
import type {PlatformDocumentation} from '@/lib/Project/Type/types';

type InfraDrilldownProps = {
  platformDocumentation: PlatformDocumentation;
  onChange: (platformDocumentation: PlatformDocumentation) => void;
};

// Orchestrates the infrastructure drill-down (cluster -> services) via
// ?clusterId= - independent of the domains chain's own params, since this is
// a separate, parallel graph (deployment view), not nested under it.
const InfraDrilldown = ({platformDocumentation, onChange}: InfraDrilldownProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const clusterId = searchParams.get('clusterId');

  const openCluster = (id: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('clusterId', id);
      return next;
    });
  };

  const backToClusters = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('clusterId');
      return next;
    });
  };

  const selectedCluster = platformDocumentation.infraClusters.find((cluster) => cluster.id === clusterId) ?? null;

  if (selectedCluster) {
    return (
      <InfraServicesGraph
        cluster={selectedCluster}
        platformDocumentation={platformDocumentation}
        onChange={onChange}
        onBack={backToClusters}
      />
    );
  }

  return (
    <InfraClustersGraph platformDocumentation={platformDocumentation} onChange={onChange} onOpenCluster={openCluster} />
  );
};

export default InfraDrilldown;
