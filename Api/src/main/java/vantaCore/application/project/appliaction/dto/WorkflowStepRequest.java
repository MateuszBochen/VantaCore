package vantaCore.application.project.appliaction.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Set;
import java.util.UUID;

final public class WorkflowStepRequest {

    @NotNull
    private final UUID statusId;

    private final Set<UUID> allowedTransitionIds;

    public WorkflowStepRequest(UUID statusId, Set<UUID> allowedTransitionIds) {
        this.statusId = statusId;
        this.allowedTransitionIds = allowedTransitionIds;
    }

    public UUID getStatusId() {
        return statusId;
    }

    public Set<UUID> getAllowedTransitionIds() {
        return allowedTransitionIds;
    }
}
