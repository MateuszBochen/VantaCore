package vantaCore.application.shared.domain.audit;

import java.util.UUID;

/**
 * Implemented by any @Audited command to expose the two ids AuditLoggingMiddleware needs but can't
 * get generically: which project the entry is scoped under, and which resource instance was
 * touched. Both existing getters on the command already carry these values in every case wired up
 * so far - implementations just delegate.
 *
 * getAuditResourceId() may return null for a command whose id is only assigned inside the handler
 * (e.g. a create-only command without an Upsert-style caller-supplied id) - AuditLoggingMiddleware
 * skips capture entirely when it does, rather than guessing. See AuditResourceType's javadoc for
 * which commands are (not) wired up.
 */
public interface AuditableCommand {

    UUID getAuditProjectId();

    UUID getAuditResourceId();
}
