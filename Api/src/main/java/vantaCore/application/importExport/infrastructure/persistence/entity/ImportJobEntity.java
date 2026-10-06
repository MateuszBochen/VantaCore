package vantaCore.application.importExport.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.importExport.domain.ImportJobAggregate;
import vantaCore.application.importExport.domain.ImportJobSnapshot;
import vantaCore.application.importExport.domain.vo.ImportJobId;
import vantaCore.application.importExport.domain.vo.ImportJobStatus;
import vantaCore.application.importExport.domain.vo.ImportReport;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "import_jobs")
public class ImportJobEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    private UUID id;

    private UUID projectId;

    @Enumerated(EnumType.STRING)
    private ImportJobStatus status;

    private int progress;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String report;

    private UUID createdByUserId;
    private Instant createdAt;
    private Instant updatedAt;

    // Hibernate requires it
    protected ImportJobEntity() {}

    private ImportJobEntity(
        UUID id,
        UUID projectId,
        ImportJobStatus status,
        int progress,
        String report,
        UUID createdByUserId,
        Instant createdAt,
        Instant updatedAt
    ) {
        this.id = id;
        this.projectId = projectId;
        this.status = status;
        this.progress = progress;
        this.report = report;
        this.createdByUserId = createdByUserId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ImportJobEntity fromDomain(ImportJobAggregate job) {
        ImportJobSnapshot snapshot = job.toSnapshot();

        return new ImportJobEntity(
            snapshot.id().value(),
            snapshot.projectId(),
            snapshot.status(),
            snapshot.progress(),
            writeReport(snapshot.report()),
            snapshot.createdByUserId(),
            snapshot.createdAt(),
            snapshot.updatedAt()
        );
    }

    public ImportJobAggregate toDomain() {
        return ImportJobAggregate.fromSnapshot(new ImportJobSnapshot(
            new ImportJobId(this.id),
            this.projectId,
            this.status,
            this.progress,
            readReport(this.report),
            this.createdByUserId,
            this.createdAt,
            this.updatedAt
        ));
    }

    private static String writeReport(ImportReport report) {
        if (report == null) {
            return null;
        }

        try {
            return MAPPER.writeValueAsString(report);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize import report", e);
        }
    }

    private static ImportReport readReport(String json) {
        if (json == null) {
            return null;
        }

        try {
            return MAPPER.readValue(json, ImportReport.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize import report", e);
        }
    }
}
