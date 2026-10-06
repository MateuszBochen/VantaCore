package vantaCore.application.documentation.platform.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.platform.domain.PlatformDocumentationAggregate;
import vantaCore.application.documentation.platform.domain.vo.GraphEdge;
import vantaCore.application.documentation.platform.domain.vo.GraphNode;
import vantaCore.application.documentation.platform.domain.vo.PlatformGraph;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
final public class UpsertPlatformDocumentationPolicy implements PolicyInterface<PlatformDocumentationAggregate> {

    @Override
    public NotificationCollection check(PlatformDocumentationAggregate documentation) {
        NotificationCollection notifications = new NotificationCollection();
        PlatformGraph graph = documentation.getGraph();

        checkEdges("domains", graph.domainEdges(), graph.domains(), notifications);
        checkParents("boundedContexts", graph.boundedContexts(), graph.domains(), notifications);
        checkEdges("boundedContexts", graph.boundedContextEdges(), graph.boundedContexts(), notifications);
        checkParents("components", graph.components(), graph.boundedContexts(), notifications);
        checkEdges("components", graph.componentEdges(), graph.components(), notifications);
        checkParents("dataFlowNodes", graph.dataFlowNodes(), graph.components(), notifications);
        checkEdges("dataFlowNodes", graph.dataFlowEdges(), graph.dataFlowNodes(), notifications);
        checkEdges("infraClusters", graph.infraClusterEdges(), graph.infraClusters(), notifications);
        checkParents("infraServices", graph.infraServices(), graph.infraClusters(), notifications);
        checkEdges("infraServices", graph.infraServiceEdges(), graph.infraServices(), notifications);

        return notifications;
    }

    private void checkEdges(
        String levelName,
        Set<GraphEdge> edges,
        Set<GraphNode> nodes,
        NotificationCollection notifications
    ) {
        Set<UUID> nodeIds = nodes.stream().map(GraphNode::id).collect(Collectors.toSet());

        for (GraphEdge edge : edges) {
            if (!nodeIds.contains(edge.source()) || !nodeIds.contains(edge.target())) {
                notifications.append(new Notification(
                    "invalid-" + levelName + "-edge",
                    "An edge in '" + levelName + "' references a node that does not exist at that level",
                    true
                ));
            }
        }
    }

    private void checkParents(
        String levelName,
        Set<GraphNode> children,
        Set<GraphNode> parents,
        NotificationCollection notifications
    ) {
        Set<UUID> parentIds = parents.stream().map(GraphNode::id).collect(Collectors.toSet());

        for (GraphNode child : children) {
            if (child.parentId() == null || !parentIds.contains(child.parentId())) {
                notifications.append(new Notification(
                    "invalid-" + levelName + "-parent",
                    "'" + child.name() + "' in '" + levelName + "' references a parent that does not exist",
                    true
                ));
            }
        }
    }
}
