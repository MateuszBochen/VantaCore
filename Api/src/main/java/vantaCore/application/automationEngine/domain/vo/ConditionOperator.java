package vantaCore.application.automationEngine.domain.vo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

// Wire values are lowerCamelCase strings (equals/notEquals/in/isEmpty), not the Java enum constant
// names - same @JsonValue/@JsonCreator round-trip pattern as Resource.
public enum ConditionOperator {
    EQUALS("equals"),
    NOT_EQUALS("notEquals"),
    IN("in"),
    IS_EMPTY("isEmpty");

    private final String code;

    ConditionOperator(String code) {
        this.code = code;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static ConditionOperator fromCode(String code) {
        return Arrays.stream(values())
            .filter(operator -> operator.code.equals(code))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown condition operator: " + code));
    }
}
