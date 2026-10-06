package vantaCore.application.automationEngine.appliaction.query.listAutomationRuleExecutions;

import vantaCore.application.automationEngine.domain.vo.ExecutedActionResult;
import vantaCore.application.automationEngine.domain.vo.ExecutionStatus;
import vantaCore.application.automationEngine.domain.vo.TriggerType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AutomationRuleExecutionResult(
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
}
