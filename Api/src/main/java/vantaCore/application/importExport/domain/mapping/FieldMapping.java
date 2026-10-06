package vantaCore.application.importExport.domain.mapping;

/** targetField is deliberately a free-form string, not an enum - it's either one of the fixed
 built-ins ("title", "description", "issueType", "status", "priority", "assignee") or "custom:{customFieldId}"
 for an arbitrary project custom field (e.g. mapping a source "key" column onto a "Legacy key"
 custom field the project owner set up beforehand - no dedicated "legacy key" mechanism needed,
 this generic mapping already covers it). See ImportMappingApplier for how each is interpreted. */
public record FieldMapping(String sourceField, String targetField) {
}
