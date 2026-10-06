package vantaCore.application.importExport.appliaction.query.previewImportConnection;

import java.util.List;
import java.util.Map;

public record ImportPreviewResult(List<String> fields, List<Map<String, String>> rows, Map<String, List<String>> fieldValues) {
}
