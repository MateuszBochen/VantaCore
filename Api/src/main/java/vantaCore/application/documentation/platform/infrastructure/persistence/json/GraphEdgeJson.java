package vantaCore.application.documentation.platform.infrastructure.persistence.json;

import vantaCore.application.documentation.platform.domain.vo.GraphEdge;

import java.util.UUID;

public record GraphEdgeJson(
    String id,
    UUID source,
    UUID target,
    String label
) {

    public static GraphEdgeJson fromDomain(GraphEdge edge) {
        return new GraphEdgeJson(edge.id(), edge.source(), edge.target(), edge.label());
    }

    public GraphEdge toDomain() {
        return new GraphEdge(this.id, this.source, this.target, this.label);
    }
}
