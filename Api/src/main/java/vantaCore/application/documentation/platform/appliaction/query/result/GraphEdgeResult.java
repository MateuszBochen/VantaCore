package vantaCore.application.documentation.platform.appliaction.query.result;

import java.util.UUID;

public record GraphEdgeResult(
    String id,
    UUID source,
    UUID target,
    String label
) {
}
