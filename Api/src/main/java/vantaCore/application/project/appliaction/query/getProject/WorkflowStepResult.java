package vantaCore.application.project.appliaction.query.getProject;

import java.util.Set;
import java.util.UUID;

public record WorkflowStepResult(
    UUID statusId,
    Set<UUID> allowedTransitionIds
) {
}
