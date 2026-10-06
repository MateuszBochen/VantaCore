package vantaCore.application.automationEngine.domain.vo;

import java.util.UUID;

/** field is a string, not an enum, by design - either one of the 4 synthetic built-in-field keys
 ("title", "priority", "status", "assignee") or a real CustomFieldDefinition id (as a UUID string)
 for this project. value is unparsed free text; IN's contract is a comma-separated list, IS_EMPTY
 ignores value entirely - see AutomationConditionEvaluator. */
public record AutomationCondition(UUID id, String field, ConditionOperator operator, String value) {

    public AutomationCondition {
        if (id == null) {
            throw new IllegalArgumentException("AutomationCondition id cannot be null");
        }
        if (field == null || field.isBlank()) {
            throw new IllegalArgumentException("AutomationCondition field cannot be blank");
        }
        if (operator == null) {
            throw new IllegalArgumentException("AutomationCondition operator cannot be null");
        }
    }
}
