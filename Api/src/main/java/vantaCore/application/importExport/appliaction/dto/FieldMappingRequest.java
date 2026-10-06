package vantaCore.application.importExport.appliaction.dto;

import jakarta.validation.constraints.NotBlank;

final public class FieldMappingRequest {

    @NotBlank
    private final String sourceField;

    @NotBlank
    private final String targetField;

    public FieldMappingRequest(String sourceField, String targetField) {
        this.sourceField = sourceField;
        this.targetField = targetField;
    }

    public String getSourceField() {
        return sourceField;
    }

    public String getTargetField() {
        return targetField;
    }
}
