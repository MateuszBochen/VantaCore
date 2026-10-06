package vantaCore.application.documentation.platform.domain.vo;

import java.util.UUID;

public record GraphNode(
    UUID id,
    String name,
    String color,
    UUID parentId,
    String description
) {
    public GraphNode {
        if (id == null) {
            throw new IllegalArgumentException("GraphNode id cannot be null");
        }
    }
}
