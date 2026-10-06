package vantaCore.application.automationEngine.appliaction.query.listAutomationEngineRules;

import vantaCore.application.automationEngine.domain.vo.TriggerType;

import java.util.Map;

public record TriggerResult(TriggerType type, Map<String, String> params) {
}
