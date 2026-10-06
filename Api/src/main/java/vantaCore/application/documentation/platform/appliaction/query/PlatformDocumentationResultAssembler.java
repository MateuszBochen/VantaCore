package vantaCore.application.documentation.platform.appliaction.query;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.platform.appliaction.query.result.BoundedContextResult;
import vantaCore.application.documentation.platform.appliaction.query.result.ComponentResult;
import vantaCore.application.documentation.platform.appliaction.query.result.DataFlowNodeResult;
import vantaCore.application.documentation.platform.appliaction.query.result.DomainResult;
import vantaCore.application.documentation.platform.appliaction.query.result.GraphEdgeResult;
import vantaCore.application.documentation.platform.appliaction.query.result.InfraClusterResult;
import vantaCore.application.documentation.platform.appliaction.query.result.InfraServiceResult;
import vantaCore.application.documentation.platform.appliaction.query.result.PlatformDocumentationResult;
import vantaCore.application.documentation.platform.domain.PlatformDocumentationAggregate;
import vantaCore.application.documentation.platform.domain.vo.GraphEdge;
import vantaCore.application.documentation.platform.domain.vo.GraphNode;
import vantaCore.application.documentation.platform.domain.vo.PlatformGraph;
import vantaCore.application.user.domain.vo.Email;
import vantaCore.application.user.domain.vo.UserId;

import java.util.Set;
import java.util.stream.Collectors;

@Component
final public class PlatformDocumentationResultAssembler {

    public PlatformDocumentationResult toResult(PlatformDocumentationAggregate documentation) {
        PlatformGraph graph = documentation.getGraph();
        UserId changedBy = documentation.getChangedBy();
        Email changedByEmail = documentation.getChangedByEmail();

        return new PlatformDocumentationResult(
            documentation.getVersionId(),
            documentation.getProjectId().value(),
            documentation.getArchitectureOverview(),
            documentation.getApi(),
            toDomainResults(graph.domains()),
            toEdgeResults(graph.domainEdges()),
            toBoundedContextResults(graph.boundedContexts()),
            toEdgeResults(graph.boundedContextEdges()),
            toComponentResults(graph.components()),
            toEdgeResults(graph.componentEdges()),
            toDataFlowNodeResults(graph.dataFlowNodes()),
            toEdgeResults(graph.dataFlowEdges()),
            toInfraClusterResults(graph.infraClusters()),
            toEdgeResults(graph.infraClusterEdges()),
            toInfraServiceResults(graph.infraServices()),
            toEdgeResults(graph.infraServiceEdges()),
            changedBy != null ? changedBy.value() : null,
            changedByEmail != null ? changedByEmail.value() : null,
            documentation.getChangedAt()
        );
    }

    private Set<DomainResult> toDomainResults(Set<GraphNode> nodes) {
        return nodes.stream()
            .map(node -> new DomainResult(node.id(), node.name(), node.color(), node.description()))
            .collect(Collectors.toSet());
    }

    private Set<BoundedContextResult> toBoundedContextResults(Set<GraphNode> nodes) {
        return nodes.stream()
            .map(node -> new BoundedContextResult(node.id(), node.name(), node.color(), node.description(), node.parentId()))
            .collect(Collectors.toSet());
    }

    private Set<ComponentResult> toComponentResults(Set<GraphNode> nodes) {
        return nodes.stream()
            .map(node -> new ComponentResult(node.id(), node.name(), node.color(), node.description(), node.parentId()))
            .collect(Collectors.toSet());
    }

    private Set<DataFlowNodeResult> toDataFlowNodeResults(Set<GraphNode> nodes) {
        return nodes.stream()
            .map(node -> new DataFlowNodeResult(node.id(), node.name(), node.color(), node.description(), node.parentId()))
            .collect(Collectors.toSet());
    }

    private Set<InfraClusterResult> toInfraClusterResults(Set<GraphNode> nodes) {
        return nodes.stream()
            .map(node -> new InfraClusterResult(node.id(), node.name(), node.color(), node.description()))
            .collect(Collectors.toSet());
    }

    private Set<InfraServiceResult> toInfraServiceResults(Set<GraphNode> nodes) {
        return nodes.stream()
            .map(node -> new InfraServiceResult(node.id(), node.name(), node.color(), node.description(), node.parentId()))
            .collect(Collectors.toSet());
    }

    private Set<GraphEdgeResult> toEdgeResults(Set<GraphEdge> edges) {
        return edges.stream()
            .map(edge -> new GraphEdgeResult(edge.id(), edge.source(), edge.target(), edge.label()))
            .collect(Collectors.toSet());
    }
}
