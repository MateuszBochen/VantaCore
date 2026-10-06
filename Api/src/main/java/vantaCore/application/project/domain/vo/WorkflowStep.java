package vantaCore.application.project.domain.vo;

import java.util.Set;
import java.util.UUID;

/** One shared project.statuses entry this issue type uses, plus which of this SAME issue type's
 other workflow steps it can transition to - allowedTransitionIds references other WorkflowStep's
 statusId values within this issue type's own workflow, not arbitrary ids from the shared pool (see
 UpsertProjectPolicy). Two issue types can reference the same statusId in their own WorkflowStep with
 completely different allowedTransitionIds - the shared Status only carries identity, not workflow. */
public record WorkflowStep(
    UUID statusId,
    Set<UUID> allowedTransitionIds
) {
    public WorkflowStep {
        if (statusId == null) {
            throw new IllegalArgumentException("WorkflowStep statusId cannot be null");
        }

        allowedTransitionIds = allowedTransitionIds == null ? Set.of() : Set.copyOf(allowedTransitionIds);
    }
}
