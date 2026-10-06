package vantaCore.application.subProject.appliaction.query.listSubProjects;

import java.util.UUID;

public record SubProjectSummaryResult(
    UUID id,
    String name,
    String status
) {
}
