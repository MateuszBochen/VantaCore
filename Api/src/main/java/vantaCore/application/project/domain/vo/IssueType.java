package vantaCore.application.project.domain.vo;

import java.util.Set;
import java.util.UUID;

public record IssueType(
    UUID id,
    String name,
    String color,
    boolean estimable,
    Set<WorkflowStep> workflow,
    UUID initialStatusId,
    Set<UUID> childTypeIds,
    String titleTemplate,
    String descriptionTemplate
) {
    public IssueType {
        if (id == null) {
            throw new IllegalArgumentException("IssueType id cannot be null");
        }

        workflow = workflow == null ? Set.of() : Set.copyOf(workflow);
        childTypeIds = childTypeIds == null ? Set.of() : Set.copyOf(childTypeIds);
    }
}
