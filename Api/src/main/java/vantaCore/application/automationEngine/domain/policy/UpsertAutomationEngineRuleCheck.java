package vantaCore.application.automationEngine.domain.policy;

import vantaCore.application.automationEngine.domain.AutomationEngineRuleAggregate;
import vantaCore.application.project.domain.ProjectAggregate;

public record UpsertAutomationEngineRuleCheck(AutomationEngineRuleAggregate rule, ProjectAggregate project) {
}
