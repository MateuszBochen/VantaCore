import type {PlatformDocumentation} from '@/lib/Project/Type/types';

// Deleting a node at one level of the domains -> bounded-contexts -> components
// chain must also drop everything scoped under it, plus any edge left
// dangling with a missing endpoint - otherwise the graph below would silently
// keep orphaned data the UI can no longer reach.

export const removeDomain = (doc: PlatformDocumentation, domainId: string): PlatformDocumentation => {
  const removedContextIds = new Set(
    doc.boundedContexts.filter((context) => context.domainId === domainId).map((context) => context.id),
  );
  const remainingContexts = doc.boundedContexts.filter((context) => context.domainId !== domainId);
  const remainingComponents = doc.components.filter((component) => !removedContextIds.has(component.boundedContextId));
  const remainingComponentIds = new Set(remainingComponents.map((component) => component.id));

  const remainingDataFlowNodes = doc.dataFlowNodes.filter((node) => remainingComponentIds.has(node.componentId));
  const remainingDataFlowNodeIds = new Set(remainingDataFlowNodes.map((node) => node.id));

  return {
    ...doc,
    domains: doc.domains.filter((domain) => domain.id !== domainId),
    domainEdges: doc.domainEdges.filter((edge) => edge.source !== domainId && edge.target !== domainId),
    boundedContexts: remainingContexts,
    boundedContextEdges: doc.boundedContextEdges.filter(
      (edge) => !removedContextIds.has(edge.source) && !removedContextIds.has(edge.target),
    ),
    components: remainingComponents,
    componentEdges: doc.componentEdges.filter(
      (edge) => remainingComponentIds.has(edge.source) && remainingComponentIds.has(edge.target),
    ),
    dataFlowNodes: remainingDataFlowNodes,
    dataFlowEdges: doc.dataFlowEdges.filter(
      (edge) => remainingDataFlowNodeIds.has(edge.source) && remainingDataFlowNodeIds.has(edge.target),
    ),
  };
};

export const removeBoundedContext = (doc: PlatformDocumentation, contextId: string): PlatformDocumentation => {
  const remainingComponents = doc.components.filter((component) => component.boundedContextId !== contextId);
  const remainingComponentIds = new Set(remainingComponents.map((component) => component.id));

  return {
    ...doc,
    boundedContexts: doc.boundedContexts.filter((context) => context.id !== contextId),
    boundedContextEdges: doc.boundedContextEdges.filter(
      (edge) => edge.source !== contextId && edge.target !== contextId,
    ),
    components: remainingComponents,
    componentEdges: doc.componentEdges.filter(
      (edge) => remainingComponentIds.has(edge.source) && remainingComponentIds.has(edge.target),
    ),
  };
};

export const removeComponent = (doc: PlatformDocumentation, componentId: string): PlatformDocumentation => {
  const remainingDataFlowNodes = doc.dataFlowNodes.filter((node) => node.componentId !== componentId);
  const remainingDataFlowNodeIds = new Set(remainingDataFlowNodes.map((node) => node.id));

  return {
    ...doc,
    components: doc.components.filter((component) => component.id !== componentId),
    componentEdges: doc.componentEdges.filter((edge) => edge.source !== componentId && edge.target !== componentId),
    dataFlowNodes: remainingDataFlowNodes,
    dataFlowEdges: doc.dataFlowEdges.filter(
      (edge) => remainingDataFlowNodeIds.has(edge.source) && remainingDataFlowNodeIds.has(edge.target),
    ),
  };
};

export const removeDataFlowNode = (doc: PlatformDocumentation, nodeId: string): PlatformDocumentation => ({
  ...doc,
  dataFlowNodes: doc.dataFlowNodes.filter((node) => node.id !== nodeId),
  dataFlowEdges: doc.dataFlowEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
});

// Infrastructure is a separate, parallel drill-down (cluster -> services) -
// same cascading-delete shape, but independent of the domains chain above.

export const removeInfraCluster = (doc: PlatformDocumentation, clusterId: string): PlatformDocumentation => {
  const remainingServices = doc.infraServices.filter((service) => service.clusterId !== clusterId);
  const remainingServiceIds = new Set(remainingServices.map((service) => service.id));

  return {
    ...doc,
    infraClusters: doc.infraClusters.filter((cluster) => cluster.id !== clusterId),
    infraClusterEdges: doc.infraClusterEdges.filter(
      (edge) => edge.source !== clusterId && edge.target !== clusterId,
    ),
    infraServices: remainingServices,
    infraServiceEdges: doc.infraServiceEdges.filter(
      (edge) => remainingServiceIds.has(edge.source) && remainingServiceIds.has(edge.target),
    ),
  };
};

export const removeInfraService = (doc: PlatformDocumentation, serviceId: string): PlatformDocumentation => ({
  ...doc,
  infraServices: doc.infraServices.filter((service) => service.id !== serviceId),
  infraServiceEdges: doc.infraServiceEdges.filter((edge) => edge.source !== serviceId && edge.target !== serviceId),
});
