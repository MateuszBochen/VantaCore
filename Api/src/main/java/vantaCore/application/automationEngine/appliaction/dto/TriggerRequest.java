package vantaCore.application.automationEngine.appliaction.dto;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.automationEngine.domain.vo.TriggerType;

import java.util.Map;

final public class TriggerRequest {

    @NotNull
    private final TriggerType type;

    private final Map<String, String> params;

    public TriggerRequest(TriggerType type, Map<String, String> params) {
        this.type = type;
        this.params = params;
    }

    public TriggerType getType() {
        return type;
    }

    public Map<String, String> getParams() {
        return params;
    }
}
