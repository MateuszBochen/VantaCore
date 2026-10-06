package vantaCore.application.auditLog.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.auditLog.domain.AuditAction;
import vantaCore.application.auditLog.domain.AuditLogEntry;
import vantaCore.application.auditLog.domain.AuditLogEntry.FieldDiff;
import vantaCore.application.shared.domain.audit.AuditResourceType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "audit_log_entries")
public class AuditLogEntryEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, FieldDiff>> DIFF_TYPE = new TypeReference<>() {
    };

    @Id
    private UUID id;

    private UUID projectId;

    @Enumerated(EnumType.STRING)
    private AuditResourceType resourceType;

    private UUID resourceId;

    @Enumerated(EnumType.STRING)
    private AuditAction action;

    private UUID actorId;
    private String actorEmail;
    private Instant occurredAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String diff;

    // Hibernate requires it
    protected AuditLogEntryEntity() {
    }

    private AuditLogEntryEntity(
        UUID id,
        UUID projectId,
        AuditResourceType resourceType,
        UUID resourceId,
        AuditAction action,
        UUID actorId,
        String actorEmail,
        Instant occurredAt,
        String diff
    ) {
        this.id = id;
        this.projectId = projectId;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.action = action;
        this.actorId = actorId;
        this.actorEmail = actorEmail;
        this.occurredAt = occurredAt;
        this.diff = diff;
    }

    public static AuditLogEntryEntity fromDomain(AuditLogEntry entry) {
        return new AuditLogEntryEntity(
            entry.id(),
            entry.projectId(),
            entry.resourceType(),
            entry.resourceId(),
            entry.action(),
            entry.actorId(),
            entry.actorEmail(),
            entry.occurredAt(),
            writeDiff(entry.diff())
        );
    }

    public AuditLogEntry toDomain() {
        return new AuditLogEntry(
            this.id,
            this.projectId,
            this.resourceType,
            this.resourceId,
            this.action,
            this.actorId,
            this.actorEmail,
            this.occurredAt,
            readDiff(this.diff)
        );
    }

    private static String writeDiff(Map<String, FieldDiff> diff) {
        try {
            return MAPPER.writeValueAsString(diff);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize audit log diff", e);
        }
    }

    private static Map<String, FieldDiff> readDiff(String json) {
        try {
            return MAPPER.readValue(json, DIFF_TYPE);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize audit log diff", e);
        }
    }
}
