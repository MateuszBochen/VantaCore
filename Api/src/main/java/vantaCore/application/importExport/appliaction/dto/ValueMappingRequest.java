package vantaCore.application.importExport.appliaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

final public class ValueMappingRequest {

    @NotBlank
    private final String sourceValue;

    @NotNull
    private final UUID targetId;

    public ValueMappingRequest(String sourceValue, UUID targetId) {
        this.sourceValue = sourceValue;
        this.targetId = targetId;
    }

    public String getSourceValue() {
        return sourceValue;
    }

    public UUID getTargetId() {
        return targetId;
    }
}
