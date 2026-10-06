package vantaCore.application.documentation.platform.appliaction.query.result;

import java.util.UUID;

public record BoundedContextResult(
    UUID id,
    String name,
    String color,
    String description,
    UUID domainId
) {
}
