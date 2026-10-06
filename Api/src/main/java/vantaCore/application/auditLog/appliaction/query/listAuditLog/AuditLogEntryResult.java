package vantaCore.application.auditLog.appliaction.query.listAuditLog;

import vantaCore.application.auditLog.domain.AuditAction;
import vantaCore.application.auditLog.domain.AuditLogEntry.FieldDiff;
import vantaCore.application.shared.domain.audit.AuditResourceType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogEntryResult(
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
}
