package vantaCore.application.auditLog.domain;

/** Derived by AuditLoggingMiddleware from before/after snapshot presence - never set explicitly by a
 command or handler. */
public enum AuditAction {
    CREATE,
    UPDATE,
    DELETE
}
