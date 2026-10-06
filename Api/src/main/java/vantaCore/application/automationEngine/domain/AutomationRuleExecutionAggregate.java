package vantaCore.application.automationEngine.domain;

import vantaCore.application.automationEngine.domain.vo.ExecutedActionResult;
import vantaCore.application.automationEngine.domain.vo.ExecutionStatus;
import vantaCore.application.automationEngine.domain.vo.TriggerType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Write-once - like TicketHistoryEntryAggregate, an execution log entry is never edited or
 deleted after creation, so there's no changeX() counterpart to newEntry(). */
public class AutomationRuleExecutionAggregate {
    private final UUID id;
    private final UUID ruleId;
    private final UUID projectId;
    private final UUID ticketId;
    private final TriggerType triggerType;
    private final ExecutionStatus status;
    private final List<ExecutedActionResult> executedActions;
    private final String errorMessage;
    private final int depth;
    private final Instant executedAt;

    private AutomationRuleExecutionAggregate(
        UUID id,
        UUID ruleId,
        UUID projectId,
        UUID ticketId,
        TriggerType triggerType,
        ExecutionStatus status,
        List<ExecutedActionResult> executedActions,
        String errorMessage,
        int depth,
        Instant executedAt
    ) {
        this.id = id;
        this.ruleId = ruleId;
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.triggerType = triggerType;
        this.status = status;
        this.executedActions = executedActions == null ? List.of() : List.copyOf(executedActions);
        this.errorMessage = errorMessage;
        this.depth = depth;
        this.executedAt = executedAt;
    }

    public static AutomationRuleExecutionAggregate newEntry(
        UUID id,
        UUID ruleId,
        UUID projectId,
        UUID ticketId,
        TriggerType triggerType,
        ExecutionStatus status,
        List<ExecutedActionResult> executedActions,
        String errorMessage,
        int depth,
        Instant executedAt
    ) {
        return new AutomationRuleExecutionAggregate(
            id, ruleId, projectId, ticketId, triggerType, status, executedActions, errorMessage, depth, executedAt
        );
    }

    public AutomationRuleExecutionSnapshot toSnapshot() {
        return new AutomationRuleExecutionSnapshot(
            id, ruleId, projectId, ticketId, triggerType, status, executedActions, errorMessage, depth, executedAt
        );
    }
}
