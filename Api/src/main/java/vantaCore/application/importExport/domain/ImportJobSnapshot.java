package vantaCore.application.importExport.domain;

import vantaCore.application.importExport.domain.vo.ImportJobId;
import vantaCore.application.importExport.domain.vo.ImportJobStatus;
import vantaCore.application.importExport.domain.vo.ImportReport;

import java.time.Instant;
import java.util.UUID;

public record ImportJobSnapshot(
    ImportJobId id,
    UUID projectId,
    ImportJobStatus status,
    int progress,
    ImportReport report,
    UUID createdByUserId,
    Instant createdAt,
    Instant updatedAt
) {
}
