package vantaCore.application.auditLog.domain.repository;

import vantaCore.application.auditLog.domain.AuditAction;
import vantaCore.application.auditLog.domain.AuditLogEntry;
import vantaCore.application.shared.domain.audit.AuditResourceType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AuditLogEntryRepositoryInterface {

    void save(AuditLogEntry entry);

    /** Newest first. Any filter field left null is simply not applied. */
    AuditLogPage findAllByProjectId(UUID projectId, AuditLogFilter filter, int page, int limit);

    record AuditLogFilter(UUID actorId, AuditResourceType resourceType, AuditAction action, Instant from, Instant till) {
    }

    record AuditLogPage(List<AuditLogEntry> items, long total) {
    }
}
