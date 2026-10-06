package vantaCore.application.automationEngine.domain;

import vantaCore.application.automationEngine.domain.vo.AutomationAction;
import vantaCore.application.automationEngine.domain.vo.AutomationCondition;
import vantaCore.application.automationEngine.domain.vo.AutomationEngineRuleId;
import vantaCore.application.automationEngine.domain.vo.AutomationTrigger;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Read-only view of an AutomationEngineRuleAggregate's state - the only way anything outside the
 aggregate gets at its fields, since the aggregate itself exposes no getters. */
public record AutomationEngineRuleSnapshot(
    AutomationEngineRuleId id,
    UUID projectId,
    String name,
    boolean enabled,
    AutomationTrigger trigger,
    List<AutomationCondition> conditions,
    List<AutomationAction> actions,
    Instant createdAt,
    Instant updatedAt
) {
}
