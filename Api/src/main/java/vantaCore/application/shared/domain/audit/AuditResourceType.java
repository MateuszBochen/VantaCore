package vantaCore.application.shared.domain.audit;

/**
 * The fixed catalog of resource kinds AuditLoggingMiddleware knows how to capture a before/after
 * snapshot for (see AuditSnapshotProviderInterface, one implementation per module). New entries are
 * added here only once a matching provider exists - a resource type with no provider is silently
 * never audited (see AuditLoggingMiddleware).
 *
 * Deliberately NOT covered yet: BOARD/SPRINT (cross-project, don't have a single owning project to
 * scope GET /api/project/{projectId}/audit-log by), ROLE (global, not project-scoped at all -
 * "permission schemes" auditing per the Audit Log sub-project's scope doc is future work),
 * attachments/test cases (out of the v1 cut for time, same provider pattern would extend cleanly).
 */
public enum AuditResourceType {
    TICKET,
    PROJECT,
    SUB_PROJECT,
    COMMENT,
    WORKLOG
}
