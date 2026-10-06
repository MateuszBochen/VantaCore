package vantaCore.application.project.appliaction.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

final public class AutomationRuleRequest {

    @NotNull
    private final UUID id;
    private final UUID parentTypeId;
    private final UUID setParentStatusId;

    public AutomationRuleRequest(UUID id, UUID parentTypeId, UUID setParentStatusId) {
        this.id = id;
        this.parentTypeId = parentTypeId;
        this.setParentStatusId = setParentStatusId;
    }

    public UUID getId() {
        return id;
    }

    public UUID getParentTypeId() {
        return parentTypeId;
    }

    public UUID getSetParentStatusId() {
        return setParentStatusId;
    }
}
