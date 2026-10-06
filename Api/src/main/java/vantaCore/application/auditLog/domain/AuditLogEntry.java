package vantaCore.application.auditLog.domain;

import vantaCore.application.shared.domain.audit.AuditResourceType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Append-only - there's no aggregate/mutator here on purpose, an audit entry is never edited or
 deleted once written. */
public record AuditLogEntry(
    UUID id,
    UUID projectId,
    AuditResourceType resourceType,
    UUID resourceId,
    AuditAction action,
    UUID actorId,
    String actorEmail,
    Instant occurredAt,
    Map<String, FieldDiff> diff
) {
    public record FieldDiff(Object before, Object after) {
    }
}
