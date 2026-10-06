package vantaCore.application.automationEngine.domain.vo;

import java.util.UUID;

public record AutomationEngineRuleId(UUID value) {

    public AutomationEngineRuleId {
        if (value == null) {
            throw new IllegalArgumentException("AutomationEngineRuleId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
