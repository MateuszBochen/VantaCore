package vantaCore.application.automationEngine.domain.vo;

import java.util.Map;

/** params is deliberately Map<String,String>, not a typed shape per trigger type - the meaning of
 each key depends on `type` (e.g. TICKET_STATUS_CHANGED -> {toStatusId?}, TICKET_FIELD_CHANGED ->
 {fieldId?}, both optional - absent means "any"). See CLAUDE.md-adjacent rule contract docs. */
public record AutomationTrigger(TriggerType type, Map<String, String> params) {

    public AutomationTrigger {
        if (type == null) {
            throw new IllegalArgumentException("AutomationTrigger type cannot be null");
        }

        params = params == null ? Map.of() : Map.copyOf(params);
    }
}
