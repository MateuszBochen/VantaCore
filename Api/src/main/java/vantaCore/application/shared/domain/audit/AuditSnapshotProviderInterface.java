package vantaCore.application.shared.domain.audit;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * One implementation per AuditResourceType, owned by that resource's own module (e.g.
 * vantaCore.application.ticket.infrastructure.audit.TicketAuditSnapshotProvider) - the module
 * translates its own aggregate into a flat top-level field map, AuditLoggingMiddleware never reaches
 * into a module's domain directly. Called once before and once after the wrapped command runs; the
 * two maps are diffed key-by-key (top-level only, no deep object diffing - see the Audit Log
 * sub-project's solution design for why).
 */
public interface AuditSnapshotProviderInterface {

    AuditResourceType resourceType();

    /** Empty when the resource doesn't exist (either genuinely absent, or not-yet-created when
     called as the "before" snapshot of a CREATE). projectId is passed through because some
     resources (e.g. sub-projects, which are versioned per-project) can't be looked up by id alone. */
    Optional<Map<String, Object>> loadSnapshot(UUID projectId, UUID resourceId);
}
