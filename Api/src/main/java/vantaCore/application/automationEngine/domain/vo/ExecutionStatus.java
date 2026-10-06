package vantaCore.application.automationEngine.domain.vo;

public enum ExecutionStatus {
    /** conditions matched, actions ran - see each ExecutedActionResult for per-action outcome */
    MATCHED,
    /** trigger fired but conditions didn't match - no actions ran */
    SKIPPED,
    /** loop-protection stopped it before evaluating conditions - see AutomationExecutionContext */
    MAX_DEPTH_EXCEEDED,
    /** an unexpected error before/during condition evaluation, not a per-action failure */
    FAILED
}
