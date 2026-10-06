package vantaCore.application.documentation.platform.domain.vo;

import java.util.Set;

public record PlatformGraph(
    Set<GraphNode> domains,
    Set<GraphEdge> domainEdges,
    Set<GraphNode> boundedContexts,
    Set<GraphEdge> boundedContextEdges,
    Set<GraphNode> components,
    Set<GraphEdge> componentEdges,
    Set<GraphNode> dataFlowNodes,
    Set<GraphEdge> dataFlowEdges,
    Set<GraphNode> infraClusters,
    Set<GraphEdge> infraClusterEdges,
    Set<GraphNode> infraServices,
    Set<GraphEdge> infraServiceEdges
) {
    public PlatformGraph {
        domains = domains == null ? Set.of() : Set.copyOf(domains);
        domainEdges = domainEdges == null ? Set.of() : Set.copyOf(domainEdges);
        boundedContexts = boundedContexts == null ? Set.of() : Set.copyOf(boundedContexts);
        boundedContextEdges = boundedContextEdges == null ? Set.of() : Set.copyOf(boundedContextEdges);
        components = components == null ? Set.of() : Set.copyOf(components);
        componentEdges = componentEdges == null ? Set.of() : Set.copyOf(componentEdges);
        dataFlowNodes = dataFlowNodes == null ? Set.of() : Set.copyOf(dataFlowNodes);
        dataFlowEdges = dataFlowEdges == null ? Set.of() : Set.copyOf(dataFlowEdges);
        infraClusters = infraClusters == null ? Set.of() : Set.copyOf(infraClusters);
        infraClusterEdges = infraClusterEdges == null ? Set.of() : Set.copyOf(infraClusterEdges);
        infraServices = infraServices == null ? Set.of() : Set.copyOf(infraServices);
        infraServiceEdges = infraServiceEdges == null ? Set.of() : Set.copyOf(infraServiceEdges);
    }
}
