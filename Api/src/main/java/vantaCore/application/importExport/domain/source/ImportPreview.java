package vantaCore.application.importExport.domain.source;

import java.util.List;
import java.util.Map;

/** rows is only a small sample (the first few records), so it can't be used to enumerate every
 value a field like issue type/status takes across the whole source - fieldValues carries that
 instead, fetched from the provider's own metadata endpoints: {source field name -> every value
 it can take}, keyed by the same names as fields/rows. Best effort - only the fields a provider
 knows how to enumerate, and an empty map when that metadata lookup fails. */
public record ImportPreview(List<String> fields, List<Map<String, String>> rows, Map<String, List<String>> fieldValues) {
    public ImportPreview {
        fieldValues = fieldValues == null ? Map.of() : Map.copyOf(fieldValues);
    }
}
