package vantaCore.application.subProject.appliaction.query.result;

import java.time.Instant;
import java.util.UUID;

public record SubProjectResult(
    UUID versionId,
    UUID subProjectId,
    UUID projectId,
    String name,
    String status,
    SubProjectDocumentationResult documentation,
    UUID changedByUserId,
    String changedByEmail,
    Instant changedAt
) {
}
