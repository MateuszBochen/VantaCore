package vantaCore.application.importExport.domain.source;

import java.util.List;
import java.util.Map;

/** sourceKey is the source system's own id/key for this record (e.g. Jira "PROJ-123", an Azure
 DevOps work item id) - used only for import-report row messages, never persisted onto the created
 ticket unless the caller explicitly mapped it to a custom field via FieldMapping. Also the key
 other records' links point at (see ImportSourceLink). */
public record ImportSourceRecord(
    String sourceKey,
    Map<String, String> fields,
    List<ImportSourceAttachment> attachments,
    List<ImportSourceComment> comments,
    List<ImportSourceLink> links,
    // Non-fatal problems fetching this record's extras (e.g. its comments couldn't be loaded even
    // after retries) - the record is still imported, these just end up in its row message.
    List<String> warnings
) {
    public ImportSourceRecord {
        links = links == null ? List.of() : List.copyOf(links);
        warnings = warnings == null ? List.of() : List.copyOf(warnings);
    }
}
