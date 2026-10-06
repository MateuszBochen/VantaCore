package vantaCore.application.automationEngine.appliaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.automationEngine.domain.vo.ConditionOperator;

import java.util.UUID;

final public class ConditionRequest {

    @NotNull
    private final UUID id;

    @NotBlank
    private final String field;

    @NotNull
    private final ConditionOperator operator;

    private final String value;

    public ConditionRequest(UUID id, String field, ConditionOperator operator, String value) {
        this.id = id;
        this.field = field;
        this.operator = operator;
        this.value = value;
    }

    public UUID getId() {
        return id;
    }

    public String getField() {
        return field;
    }

    public ConditionOperator getOperator() {
        return operator;
    }

    public String getValue() {
        return value;
    }
}
