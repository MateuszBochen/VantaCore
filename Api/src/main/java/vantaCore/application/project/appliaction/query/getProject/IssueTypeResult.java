package vantaCore.application.project.appliaction.query.getProject;

import java.util.Set;
import java.util.UUID;

public record IssueTypeResult(
    UUID id,
    String name,
    String color,
    boolean estimable,
    Set<WorkflowStepResult> workflow,
    UUID initialStatusId,
    Set<UUID> childTypeIds,
    String titleTemplate,
    String descriptionTemplate
) {
}
