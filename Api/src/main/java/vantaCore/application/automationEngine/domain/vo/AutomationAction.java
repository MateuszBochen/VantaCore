package vantaCore.application.automationEngine.domain.vo;

import java.util.Map;
import java.util.UUID;

/** params shape depends on type - see AutomationActionExecutor for exactly which keys each type
 reads (e.g. SET_STATUS -> {statusId}, SET_FIELD_VALUE -> {fieldId, value}, ASSIGN_NEXT_VERSION ->
 {} always empty). */
public record AutomationAction(UUID id, ActionType type, Map<String, String> params) {

    public AutomationAction {
        if (id == null) {
            throw new IllegalArgumentException("AutomationAction id cannot be null");
        }
        if (type == null) {
            throw new IllegalArgumentException("AutomationAction type cannot be null");
        }

        params = params == null ? Map.of() : Map.copyOf(params);
    }
}
