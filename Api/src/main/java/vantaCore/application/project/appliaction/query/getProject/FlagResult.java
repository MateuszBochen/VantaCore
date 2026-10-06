package vantaCore.application.project.appliaction.query.getProject;

import java.util.UUID;

public record FlagResult(
    UUID id,
    String name,
    String color
) {
}