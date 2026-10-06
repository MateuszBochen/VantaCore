package vantaCore.application.importExport.domain;

import vantaCore.application.importExport.domain.vo.ImportJobId;
import vantaCore.application.importExport.domain.vo.ImportJobStatus;
import vantaCore.application.importExport.domain.vo.ImportReport;

import java.time.Instant;
import java.util.UUID;

/** Narrow-mutator progression, same style as TicketAggregate.withRelatedTickets - no setters,
 each transition returns a new instance. A job only ever moves PENDING -> RUNNING -> (COMPLETED |
 FAILED), never backwards - see ImportJobRunner for the state machine driving these. */
public class ImportJobAggregate {
    private final ImportJobId id;
    private final UUID projectId;
    private final ImportJobStatus status;
    private final int progress;
    private final ImportReport report;
    private final UUID createdByUserId;
    private final Instant createdAt;
    private final Instant updatedAt;

    private ImportJobAggregate(
        ImportJobId id,
        UUID projectId,
        ImportJobStatus status,
        int progress,
        ImportReport report,
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

    public static ImportJobAggregate newJob(ImportJobId id, UUID projectId, UUID createdByUserId, Instant now) {
        return new ImportJobAggregate(id, projectId, ImportJobStatus.PENDING, 0, null, createdByUserId, now, now);
    }

    /** Rebuilds from storage - see JpaImportJobRepositoryAdapter. */
    public static ImportJobAggregate fromSnapshot(ImportJobSnapshot snapshot) {
        return new ImportJobAggregate(
            snapshot.id(),
            snapshot.projectId(),
            snapshot.status(),
            snapshot.progress(),
            snapshot.report(),
            snapshot.createdByUserId(),
            snapshot.createdAt(),
            snapshot.updatedAt()
        );
    }

    public ImportJobAggregate withRunning(Instant now) {
        return new ImportJobAggregate(id, projectId, ImportJobStatus.RUNNING, progress, report, createdByUserId, createdAt, now);
    }

    public ImportJobAggregate withProgress(int newProgress, Instant now) {
        return new ImportJobAggregate(id, projectId, status, newProgress, report, createdByUserId, createdAt, now);
    }

    public ImportJobAggregate withCompleted(ImportReport newReport, Instant now) {
        return new ImportJobAggregate(id, projectId, ImportJobStatus.COMPLETED, 100, newReport, createdByUserId, createdAt, now);
    }

    /** newReport may be a partial report (rows processed before the failure) or null if nothing
     was processed yet - either way progress is left as-is, not forced to 100, since a failure
     mid-run genuinely didn't finish. */
    public ImportJobAggregate withFailed(ImportReport newReport, Instant now) {
        return new ImportJobAggregate(id, projectId, ImportJobStatus.FAILED, progress, newReport, createdByUserId, createdAt, now);
    }

    public ImportJobSnapshot toSnapshot() {
        return new ImportJobSnapshot(id, projectId, status, progress, report, createdByUserId, createdAt, updatedAt);
    }
}
