package vantaCore.application.documentation.platform.infrastructure.persistence.json;

import vantaCore.application.documentation.platform.domain.vo.GraphEdge;
import vantaCore.application.documentation.platform.domain.vo.GraphNode;
import vantaCore.application.documentation.platform.domain.vo.PlatformGraph;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public record PlatformGraphJson(
    List<GraphNodeJson> domains,
    List<GraphEdgeJson> domainEdges,
    List<GraphNodeJson> boundedContexts,
    List<GraphEdgeJson> boundedContextEdges,
    List<GraphNodeJson> components,
    List<GraphEdgeJson> componentEdges,
    List<GraphNodeJson> dataFlowNodes,
    List<GraphEdgeJson> dataFlowEdges,
    List<GraphNodeJson> infraClusters,
    List<GraphEdgeJson> infraClusterEdges,
    List<GraphNodeJson> infraServices,
    List<GraphEdgeJson> infraServiceEdges
) {

    public static PlatformGraphJson fromDomain(PlatformGraph graph) {
        return new PlatformGraphJson(
            nodesToJson(graph.domains()),
            edgesToJson(graph.domainEdges()),
            nodesToJson(graph.boundedContexts()),
            edgesToJson(graph.boundedContextEdges()),
            nodesToJson(graph.components()),
            edgesToJson(graph.componentEdges()),
            nodesToJson(graph.dataFlowNodes()),
            edgesToJson(graph.dataFlowEdges()),
            nodesToJson(graph.infraClusters()),
            edgesToJson(graph.infraClusterEdges()),
            nodesToJson(graph.infraServices()),
            edgesToJson(graph.infraServiceEdges())
        );
    }

    public PlatformGraph toDomain() {
        return new PlatformGraph(
            nodesToDomain(this.domains),
            edgesToDomain(this.domainEdges),
            nodesToDomain(this.boundedContexts),
            edgesToDomain(this.boundedContextEdges),
            nodesToDomain(this.components),
            edgesToDomain(this.componentEdges),
            nodesToDomain(this.dataFlowNodes),
            edgesToDomain(this.dataFlowEdges),
            nodesToDomain(this.infraClusters),
            edgesToDomain(this.infraClusterEdges),
            nodesToDomain(this.infraServices),
            edgesToDomain(this.infraServiceEdges)
        );
    }

    private static List<GraphNodeJson> nodesToJson(Set<GraphNode> nodes) {
        return nodes.stream().map(GraphNodeJson::fromDomain).toList();
    }

    private static List<GraphEdgeJson> edgesToJson(Set<GraphEdge> edges) {
        return edges.stream().map(GraphEdgeJson::fromDomain).toList();
    }

    private static Set<GraphNode> nodesToDomain(List<GraphNodeJson> nodes) {
        if (nodes == null) {
            return Collections.emptySet();
        }
        return nodes.stream().map(GraphNodeJson::toDomain).collect(Collectors.toSet());
    }

    private static Set<GraphEdge> edgesToDomain(List<GraphEdgeJson> edges) {
        if (edges == null) {
            return Collections.emptySet();
        }
        return edges.stream().map(GraphEdgeJson::toDomain).collect(Collectors.toSet());
    }
}
