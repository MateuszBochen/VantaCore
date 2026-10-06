package vantaCore.application.documentation.platform.domain.vo;

import java.util.UUID;

public record GraphEdge(
    String id,
    UUID source,
    UUID target,
    String label
) {
    public GraphEdge {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("GraphEdge id cannot be blank");
        }

        if (source == null || target == null) {
            throw new IllegalArgumentException("GraphEdge source and target cannot be null");
        }
    }
}
