package vantaCore.application.project.appliaction.query.getProject;

import java.util.List;
import java.util.UUID;

public record CustomFieldDefinitionResult(
    UUID id,
    String name,
    String type,
    List<String> options,
    boolean multiple
) {
}