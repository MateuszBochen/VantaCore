package vantaCore.application.auditLog.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.auditLog.infrastructure.persistence.entity.AuditLogEntryEntity;

import java.util.UUID;

public interface SpringDataAuditLogEntryRepositoryInterface extends JpaRepository<AuditLogEntryEntity, UUID> {
}
