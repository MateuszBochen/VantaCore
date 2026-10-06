package vantaCore.application.documentation.platform.appliaction.query.result;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record PlatformDocumentationResult(
    UUID versionId,
    UUID projectId,
    String architectureOverview,
    String api,
    Set<DomainResult> domains,
    Set<GraphEdgeResult> domainEdges,
    Set<BoundedContextResult> boundedContexts,
    Set<GraphEdgeResult> boundedContextEdges,
    Set<ComponentResult> components,
    Set<GraphEdgeResult> componentEdges,
    Set<DataFlowNodeResult> dataFlowNodes,
    Set<GraphEdgeResult> dataFlowEdges,
    Set<InfraClusterResult> infraClusters,
    Set<GraphEdgeResult> infraClusterEdges,
    Set<InfraServiceResult> infraServices,
    Set<GraphEdgeResult> infraServiceEdges,
    UUID changedByUserId,
    String changedByEmail,
    Instant changedAt
) {
}
