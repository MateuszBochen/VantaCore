package vantaCore.application.project.appliaction.query.getProject;

import java.util.UUID;

public record StatusResult(
    UUID id,
    String name,
    String color,
    boolean isDone
) {
}
