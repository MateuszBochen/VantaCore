package vantaCore.application.automationEngine.appliaction.dto;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.automationEngine.domain.vo.ActionType;

import java.util.Map;
import java.util.UUID;

final public class ActionRequest {

    @NotNull
    private final UUID id;

    @NotNull
    private final ActionType type;

    private final Map<String, String> params;

    public ActionRequest(UUID id, ActionType type, Map<String, String> params) {
        this.id = id;
        this.type = type;
        this.params = params;
    }

    public UUID getId() {
        return id;
    }

    public ActionType getType() {
        return type;
    }

    public Map<String, String> getParams() {
        return params;
    }
}
