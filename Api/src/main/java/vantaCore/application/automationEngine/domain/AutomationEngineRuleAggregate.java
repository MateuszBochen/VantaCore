package vantaCore.application.automationEngine.domain;

import vantaCore.application.automationEngine.domain.vo.AutomationAction;
import vantaCore.application.automationEngine.domain.vo.AutomationCondition;
import vantaCore.application.automationEngine.domain.vo.AutomationEngineRuleId;
import vantaCore.application.automationEngine.domain.vo.AutomationTrigger;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Unlike PlatformDocumentation/SubProject (append-only version history), this is a plain mutable
 row - PUT upserts by client-generated id, no edit history is kept for the rule definition itself
 (only for its executions, see AutomationRuleExecutionAggregate-equivalent/the executions table). */
public class AutomationEngineRuleAggregate {
    private final AutomationEngineRuleId id;
    private final UUID projectId;
    private final String name;
    private final boolean enabled;
    private final AutomationTrigger trigger;
    private final List<AutomationCondition> conditions;
    private final List<AutomationAction> actions;
    private final Instant createdAt;
    private final Instant updatedAt;

    private AutomationEngineRuleAggregate(
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
        this.id = id;
        this.projectId = projectId;
        this.name = name;
        this.enabled = enabled;
        this.trigger = trigger;
        this.conditions = conditions == null ? List.of() : List.copyOf(conditions);
        this.actions = actions == null ? List.of() : List.copyOf(actions);
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /** A brand-new rule - also used to rebuild one from storage, since id/projectId/createdAt are
     supplied either way. createdAt == updatedAt at creation. */
    public static AutomationEngineRuleAggregate newRule(
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
        return new AutomationEngineRuleAggregate(id, projectId, name, enabled, trigger, conditions, actions, createdAt, updatedAt);
    }

    /** Replaces this rule's editable fields - id/projectId/createdAt are fixed for the rule's
     lifetime and always carry over from the current instance, never from the caller. updatedAt is
     supplied fresh by the caller on every edit. */
    public AutomationEngineRuleAggregate changeRule(
        String name,
        boolean enabled,
        AutomationTrigger trigger,
        List<AutomationCondition> conditions,
        List<AutomationAction> actions,
        Instant updatedAt
    ) {
        return new AutomationEngineRuleAggregate(
            this.id, this.projectId, name, enabled, trigger, conditions, actions, this.createdAt, updatedAt
        );
    }

    public AutomationEngineRuleSnapshot toSnapshot() {
        return new AutomationEngineRuleSnapshot(id, projectId, name, enabled, trigger, conditions, actions, createdAt, updatedAt);
    }
}
