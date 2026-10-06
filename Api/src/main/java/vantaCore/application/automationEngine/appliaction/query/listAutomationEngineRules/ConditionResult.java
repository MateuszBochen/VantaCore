package vantaCore.application.automationEngine.appliaction.query.listAutomationEngineRules;

import vantaCore.application.automationEngine.domain.vo.ConditionOperator;

import java.util.UUID;

public record ConditionResult(UUID id, String field, ConditionOperator operator, String value) {
}
