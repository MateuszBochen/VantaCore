package vantaCore.application.importExport.appliaction.query.getImportJob;

import vantaCore.application.importExport.domain.vo.ImportJobStatus;
import vantaCore.application.importExport.domain.vo.ImportReport;

import java.util.UUID;

/** report reuses the domain ImportReport/ImportRowResult records directly (rather than duplicating
 near-identical Result DTOs for them) - they're already simple, stable, wire-shaped value types with
 nothing domain-internal to hide, same precedent as AuditLogEntryResult reusing FieldDiff directly. */
public record ImportJobResult(
    UUID id,
    ImportJobStatus status,
    int progress,
    ImportReport report
) {
}
