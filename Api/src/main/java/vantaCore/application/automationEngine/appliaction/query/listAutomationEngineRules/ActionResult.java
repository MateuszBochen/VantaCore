package vantaCore.application.automationEngine.appliaction.query.listAutomationEngineRules;

import vantaCore.application.automationEngine.domain.vo.ActionType;

import java.util.Map;
import java.util.UUID;

public record ActionResult(UUID id, ActionType type, Map<String, String> params) {
}
