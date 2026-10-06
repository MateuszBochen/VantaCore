package vantaCore.application.automationEngine.appliaction.query.listAutomationEngineRules;

import java.util.List;
import java.util.UUID;

public record AutomationEngineRuleResult(
    UUID id,
    UUID projectId,
    String name,
    boolean enabled,
    TriggerResult trigger,
    List<ConditionResult> conditions,
    List<ActionResult> actions
) {
}
