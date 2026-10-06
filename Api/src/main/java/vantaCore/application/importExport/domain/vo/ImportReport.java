package vantaCore.application.importExport.domain.vo;

import java.util.List;

public record ImportReport(
    int createdCount,
    int skippedCount,
    int failedCount,
    int skippedAttachmentsCount,
    int skippedCommentsCount,
    List<ImportRowResult> rows
) {
    public ImportReport {
        rows = rows == null ? List.of() : List.copyOf(rows);
    }
}
