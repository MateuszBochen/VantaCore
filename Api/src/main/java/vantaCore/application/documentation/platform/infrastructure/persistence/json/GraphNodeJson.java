package vantaCore.application.documentation.platform.infrastructure.persistence.json;

import vantaCore.application.documentation.platform.domain.vo.GraphNode;

import java.util.UUID;

public record GraphNodeJson(
    UUID id,
    String name,
    String color,
    UUID parentId,
    String description
) {

    public static GraphNodeJson fromDomain(GraphNode node) {
        return new GraphNodeJson(node.id(), node.name(), node.color(), node.parentId(), node.description());
    }

    public GraphNode toDomain() {
        return new GraphNode(this.id, this.name, this.color, this.parentId, this.description);
    }
}
